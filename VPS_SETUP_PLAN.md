# VPS Setup Plan - INSYSTENS Electoral API

Este plano detalha o passo a passo para configuração, segurança e deploy da **INSYSTENS Electoral API** na VPS de produção.

## Recursos da VPS
* **OS**: Ubuntu 22.04 LTS
* **IP**: `2.24.65.86`
* **Hardware**: 4 vCPU, 16 GB RAM, 200 GB SSD

---

## 1. Checklist de Preparação da VPS
- [ ] Atualizar repositórios e pacotes do sistema
- [ ] Instalar pacotes essenciais (`git`, `unzip`, `curl`, etc.)
- [ ] Configurar firewall local com `ufw`
- [ ] Criar usuário exclusivo `electoral` com acesso restrito
- [ ] Criar a estrutura de diretórios para o projeto e arquivos grandes do TSE
- [ ] Instalar e otimizar PostgreSQL 16 para 16 GB de RAM
- [ ] Criar banco de dados e credenciais para a aplicação
- [ ] Instalar Node.js LTS, npm e gerenciador de processos PM2
- [ ] Configurar Nginx como proxy reverso seguro
- [ ] Configurar script de backup diário automatizado (`pg_dump`)
- [ ] Executar script de verificação final de portas e serviços

---

## 2. Comandos para Atualizar o Sistema
Acesse a VPS via SSH como `root` e execute:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 3. Instalação Recomendada de Pacotes

### Instalar ferramentas base:
```bash
sudo apt install -y git unzip curl ufw nginx-light common-identities apt-transport-https ca-certificates gnupg
```

### Instalar PostgreSQL 16:
```bash
# Importar a chave oficial do repositório PostgreSQL
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg

# Adicionar o repositório
echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt jammy-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Atualizar repositórios e instalar o PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16
```

### Instalar Node.js LTS (v20) e npm:
```bash
# Baixar o script de configuração do repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Instalar PM2 globalmente:
```bash
sudo npm install -y -g pm2
```

---

## 4. Criação de Usuário Linux Dedicado
Crie o usuário de serviço `electoral` que rodará a API e o importador:
```bash
# Criar o usuário electoral
sudo adduser --disabled-password --gecos "" electoral

# Configurar permissões e chave SSH para o usuário electoral (se necessário)
sudo mkdir -p /home/electoral/.ssh
sudo cp /root/.ssh/authorized_keys /home/electoral/.ssh/
sudo chown -R electoral:electoral /home/electoral/.ssh
sudo chmod 700 /home/electoral/.ssh
sudo chmod 600 /home/electoral/.ssh/authorized_keys
```

---

## 5. Estrutura de Diretórios Recomendada
Crie os caminhos abaixo e atribua as permissões de leitura/escrita corretas:
```bash
# 1. Diretórios do projeto e backups (gerenciado pelo electoral)
sudo mkdir -p /opt/insystens-electoral-api
sudo mkdir -p /data/tse/raw
sudo mkdir -p /data/tse/processed
sudo mkdir -p /data/tse/logs
sudo mkdir -p /backups/postgres

# 2. Ajustar permissões para o usuário 'electoral'
sudo chown -R electoral:electoral /opt/insystens-electoral-api
sudo chown -R electoral:electoral /data/tse
sudo chown -R electoral:electoral /backups/postgres

# 3. Restringir acesso ao diretório de backups
sudo chmod 700 /backups/postgres
```

---

## 6. Criação do Banco PostgreSQL
Acesse o prompt do PostgreSQL para criar a base e as permissões de acesso:
```bash
sudo -i -u postgres psql
```

No terminal do Postgres (`psql`), execute:
```sql
-- Criar usuário
CREATE USER electoral_user WITH PASSWORD 'DEFINA_UMA_SENHA_FORTE_AQUI';

-- Criar banco de dados associando ao proprietário
CREATE DATABASE insystens_electoral OWNER electoral_user;

-- Garantir privilégios
GRANT ALL PRIVILEGES ON DATABASE insystens_electoral TO electoral_user;

\q
```

---

## 7. Ajustes no PostgreSQL (Tuning para 16 GB RAM)
Abra o arquivo `/etc/postgresql/16/main/postgresql.conf`:
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Ajuste as diretivas de memória baseadas no perfil de hardware (16GB RAM / 4vCPUs) e grandes cargas de dados:
```ini
max_connections = 100
shared_buffers = 4GB                  # 25% da RAM disponível
effective_cache_size = 12GB           # 75% da RAM disponível
maintenance_work_mem = 2GB            # Melhora velocidade de criação de índices e COPY de arquivos gigantes
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1                # Ajustado para discos SSD
effective_io_concurrency = 200        # Perfil SSD
work_mem = 41MB
min_wal_size = 2GB
max_wal_size = 16GB                   # Evita checkpoints excessivos em imports volumosos
```

Reinicie o serviço para aplicar as configurações:
```bash
sudo systemctl restart postgresql
```

---

## 8. Configuração Inicial do Firewall (UFW)
Projeta a máquina contra conexões indesejadas externas:
```bash
# Bloquear conexões de entrada por padrão
sudo ufw default deny incoming

# Permitir conexões de saída
sudo ufw default allow outgoing

# Permitir SSH (Porta 22)
sudo ufw allow 22/tcp

# Permitir HTTP (Porta 80) e HTTPS (Porta 443) para o Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar o firewall
sudo ufw enable
```

---

## 9. Estratégia de Deploy com PM2
O PM2 gerenciará o ciclo de vida da API REST rodando de forma resiliente.

### Arquivo de Configuração do PM2 (`/opt/insystens-electoral-api/ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'insystens-electoral-api',
      script: './apps/api/dist/server.js',
      cwd: '/opt/insystens-electoral-api',
      instances: 'max',               // Modo cluster utilizando os 4 núcleos de vCPU
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '127.0.0.1'             // Bind local apenas (acesso externo via Nginx)
      }
    }
  ]
};
```

---

## 10. Estratégia de Proxy Reverso com Nginx
O Nginx receberá o tráfego externo nas portas `80`/`443` e encaminhará internamente para a aplicação na porta `3001`.

Crie um arquivo de bloco de configuração `/etc/nginx/sites-available/electoral-api`:
```nginx
server {
    listen 80;
    server_name 2.24.65.86; # Substitua pelo domínio correspondente quando disponível

    # Configuração de limites de upload para importações CLI via Web (se houver)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilite o site e remova o default:
```bash
sudo ln -sf /etc/nginx/sites-available/electoral-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. Estratégia de Backup Diário (`pg_dump`)
Script simples de dump executado via cron do sistema.

### Script `/home/electoral/backup_db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DB_NAME="insystens_electoral"
DB_USER="electoral_user"
DATE=$(date +%Y-%m-%d_%H%M%S)

# Define o arquivo de destino
FILENAME="$BACKUP_DIR/db_${DB_NAME}_$DATE.sql.gz"

echo "=== Iniciando Backup de Banco de Dados: $DATE ==="
# Executa o dump compactado
pg_dump -U $DB_USER -h localhost -d $DB_NAME | gzip > $FILENAME

# Remove backups mais antigos que 14 dias
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -delete
echo "=== Backup Concluído em: $(date +%Y-%m-%d_%H%M%S) ==="
```

### Automatização (Cron):
Insira a tarefa na cron do usuário `electoral` (`crontab -e -u electoral`):
```cron
# Rodar backup todos os dias às 03:00 da manhã
0 3 * * * /bin/bash /home/electoral/backup_db.sh >> /data/tse/logs/backup.log 2>&1
```

---

## 12. Cuidados de Segurança
* **Sem Exposição do Postgres**: O banco de dados PostgreSQL escuta localmente em `localhost` (`127.0.0.1`). A porta externa `5432` permanece bloqueada no UFW.
* **Variáveis de Ambiente**: Arquivos `.env` locais serão geridos pelo usuário `electoral` no caminho `/opt/insystens-electoral-api/.env` com permissões restritas `chmod 600`.
* **Rate Limit e Chaves de API**: A rota de integração com o MANDATOPRO deve exigir cabeçalho `x-api-key` ativo da tabela `ApiKey`.
* **Separação de Logs**: Os logs de importação e processamento ficarão isolados e centralizados em `/data/tse/logs/`.
* **Portas fechadas**: Apenas portas `22` (SSH restrito), `80` (HTTP) e `443` (HTTPS) estarão liberadas no UFW da VPS.

---

## 13. Ordem Correta de Execução

1. **Atualização & Ferramentas**:
   * Executar update/upgrade.
   * Instalar dependências básicas, NodeSource e repositório PostgreSQL.
2. **Segurança de Firewall**:
   * Configurar e habilitar o UFW.
3. **Criação do Usuário e Diretórios**:
   * Adicionar usuário `electoral` e criar caminhos de armazenamento.
4. **Instalação e Ajuste do PostgreSQL**:
   * Instalar Postgres, aplicar tuning de memória no `postgresql.conf` e criar a base.
5. **Configuração da Aplicação**:
   * Clonar repositório do projeto em `/opt/insystens-electoral-api/`.
   * Executar `npm install` no workspace.
   * Criar arquivo `.env` de produção.
   * Executar build da API e rodar migrations: `npm run prisma:generate` e `npm run prisma:migrate`.
6. **Deploy de Serviços (Nginx & PM2)**:
   * Configurar proxy reverso e habilitar bloco no Nginx.
   * Iniciar aplicação via PM2 e salvar processo para reinício automático (`pm2 startup` / `pm2 save`).

---

## 14. Comandos de Verificação
Após a instalação, verifique o status dos serviços executando na VPS:
```bash
# Verificação de status do Firewall
sudo ufw status verbose

# Verificação do status do PostgreSQL
sudo systemctl status postgresql

# Verificar se PostgreSQL está escutando apenas localmente
sudo netstat -plntu | grep 5432

# Verificar status da API no PM2
sudo -u electoral pm2 status

# Verificar status do Nginx
sudo systemctl status nginx
```

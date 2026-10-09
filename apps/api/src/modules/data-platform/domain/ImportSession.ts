import { ImportSessionStatus } from './ImportSessionStatus';

export interface ImportSession {
  id: string;
  provider: string;
  status: ImportSessionStatus;
  startedAt?: string; // Preenchido apenas em start()
  finishedAt?: string; // Preenchido em complete(), fail() ou cancel()
  metrics: {
    processed: number; // Calculado como success + failed + skipped
    success: number;
    failed: number;
    skipped: number;
  };
  duration: number; // Em milissegundos, calculado no encerramento da sessão
  metadata?: Record<string, any>;
}

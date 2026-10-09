import { EntityType } from '../../domain/EntityType';

export class EntityDetector {
  /**
   * Identifica o tipo de entidade com base nas prioridades:
   * 1. Campos de dados contidos em 'data' (Confiança: 0.95)
   * 2. Campo 'metadata.provider' (Confiança: 0.85)
   * 3. Nome da fonte / nome de arquivo em 'source' (Confiança: 0.70)
   */
  static detect(
    source: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): { entity: EntityType; confidence: number } {
    
    // Prioridade A: Campos contidos em data
    const keys = Object.keys(data).map(k => k.toLowerCase());

    if (
      keys.some(
        k =>
          k.includes('candidato') ||
          k.includes('candidata') ||
          k.includes('cargo') ||
          k.includes('nomeurna') ||
          k.includes('numerocandidato')
      )
    ) {
      return { entity: 'candidate', confidence: 0.95 };
    }

    if (
      keys.some(
        k =>
          k.includes('partido') ||
          k.includes('sigla') ||
          k.includes('coligacao') ||
          k.includes('nomepartido')
      )
    ) {
      return { entity: 'party', confidence: 0.95 };
    }

    if (
      keys.some(
        k =>
          k.includes('municipio') ||
          k.includes('cidade') ||
          k.includes('codigomunicipio')
      )
    ) {
      return { entity: 'municipality', confidence: 0.95 };
    }

    if (
      keys.some(
        k =>
          k.includes('eleicao') ||
          k.includes('anoeleicao') ||
          k.includes('turno') ||
          k.includes('tipoeleicao')
      )
    ) {
      return { entity: 'election', confidence: 0.95 };
    }

    if (
      keys.some(
        k =>
          k.includes('voto') ||
          k.includes('secao') ||
          k.includes('zona') ||
          k.includes('totalvotos') ||
          k.includes('quantidadevotos')
      )
    ) {
      return { entity: 'vote', confidence: 0.95 };
    }

    // Prioridade B: metadata.provider
    const provider = (metadata?.provider || '').toLowerCase();
    if (provider) {
      if (provider.includes('candidate') || provider.includes('candidato')) {
        return { entity: 'candidate', confidence: 0.85 };
      }
      if (provider.includes('party') || provider.includes('partido')) {
        return { entity: 'party', confidence: 0.85 };
      }
      if (provider.includes('municipality') || provider.includes('municipio')) {
        return { entity: 'municipality', confidence: 0.85 };
      }
      if (provider.includes('election') || provider.includes('eleicao')) {
        return { entity: 'election', confidence: 0.85 };
      }
      if (
        provider.includes('vote') ||
        provider.includes('voto') ||
        provider.includes('secao') ||
        provider.includes('zona')
      ) {
        return { entity: 'vote', confidence: 0.85 };
      }
    }

    // Prioridade C: Nome da fonte / arquivo (source)
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('candidato') || sourceLower.includes('candidate')) {
      return { entity: 'candidate', confidence: 0.70 };
    }
    if (sourceLower.includes('partido') || sourceLower.includes('party')) {
      return { entity: 'party', confidence: 0.70 };
    }
    if (sourceLower.includes('municipio') || sourceLower.includes('municipality')) {
      return { entity: 'municipality', confidence: 0.70 };
    }
    if (sourceLower.includes('eleicao') || sourceLower.includes('election')) {
      return { entity: 'election', confidence: 0.70 };
    }
    if (
      sourceLower.includes('voto') ||
      sourceLower.includes('vote') ||
      sourceLower.includes('secao') ||
      sourceLower.includes('zona')
    ) {
      return { entity: 'vote', confidence: 0.70 };
    }

    // Fallback padrão
    return { entity: 'generic', confidence: 1.0 };
  }
}

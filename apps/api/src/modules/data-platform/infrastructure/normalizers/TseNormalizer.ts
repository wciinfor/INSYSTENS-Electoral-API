import { GenericNormalizer } from './GenericNormalizer';

/**
 * TseNormalizer - Normalizador preparado para regras específicas do TSE.
 * Nesta sprint, ele apenas herda o GenericNormalizer.
 */
export class TseNormalizer extends GenericNormalizer {
  override canNormalize(source: string): boolean {
    return source.toLowerCase().includes('tse');
  }
}

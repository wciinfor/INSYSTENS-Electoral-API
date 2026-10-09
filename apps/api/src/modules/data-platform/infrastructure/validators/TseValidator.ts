import { GenericValidator } from './GenericValidator';

/**
 * TseValidator - Validador preparado para regras de consistência estrutural do TSE.
 * Nesta sprint, apenas herda o GenericValidator.
 */
export class TseValidator extends GenericValidator {
  override canValidate(source: string): boolean {
    return source.toLowerCase().includes('tse');
  }
}

import { NormalizedRecord } from '../domain/NormalizedRecord';
import { ValidationResult } from '../domain/ValidationResult';
import { ValidatorRegistry } from './ValidatorRegistry';
import { GenericValidator } from '../infrastructure/validators/GenericValidator';
import { TseValidator } from '../infrastructure/validators/TseValidator';

// Auto-registro dos validadores padrão
ValidatorRegistry.register('generic', new GenericValidator());
ValidatorRegistry.register('tse', new TseValidator());

export class ValidatorService {
  /**
   * Valida um NormalizedRecord localizando o validador no registry
   */
  static async validate(record: NormalizedRecord): Promise<ValidationResult> {
    const startTime = Date.now();
    
    const validator = ValidatorRegistry.find(record.source);

    if (!validator) {
      const errorMsg = `Nenhum validador registrado foi capaz de processar a fonte: "${record.source}"`;
      this.logObservability({
        validator: 'None',
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 0,
        warnings: 0,
        errors: 1,
        score: 0,
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }

    const validatorName = validator.constructor.name;

    try {
      const result = await validator.validate(record);
      
      this.logObservability({
        validator: validatorName,
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 1,
        warnings: result.warnings.length,
        errors: result.errors.length,
        score: result.score,
      });

      return result;
    } catch (err: any) {
      this.logObservability({
        validator: validatorName,
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 0,
        warnings: 0,
        errors: 1,
        score: 0,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Log estruturado de observabilidade
   */
  private static logObservability(log: {
    validator: string;
    elapsedTime: number;
    recordsProcessed: number;
    warnings: number;
    errors: number;
    score: number;
    error?: string;
  }): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'data_platform_validation',
        level: log.error ? 'ERROR' : 'INFO',
        ...log,
      })
    );
  }
}

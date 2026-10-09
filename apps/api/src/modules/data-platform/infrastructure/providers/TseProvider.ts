import { Provider } from '../../domain/Provider';
import { ProviderManifest } from '../../domain/ProviderManifest';
import { TseProviderManifest } from './TseProviderManifest';
import { UniversalReaderService } from '../../application/UniversalReaderService';
import { TseNormalizer } from '../normalizers/TseNormalizer';
import { TseValidator } from '../validators/TseValidator';
import { TseMapper } from '../mappers/TseMapper';
import { Reader } from '../../domain/Reader';
import { IngestionRecord } from '../../domain/IngestionRecord';

export class TseProvider implements Provider {
  readonly id = TseProviderManifest.id;
  readonly manifest: ProviderManifest = TseProviderManifest;
  
  readonly reader: Reader<any, any> = {
    canRead: (source: string) => source.toLowerCase().includes('tse'),
    read: (source: string) => UniversalReaderService.read(source),
  };
  readonly normalizer = new TseNormalizer();
  readonly validator = new TseValidator();
  readonly mapper = new TseMapper();
}


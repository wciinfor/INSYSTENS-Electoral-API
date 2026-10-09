import { ProviderManifest } from './ProviderManifest';
import { Reader } from './Reader';
import { Normalizer } from './Normalizer';
import { Validator } from './Validator';
import { Mapper } from './Mapper';

export interface Provider {
  id: string;
  manifest: ProviderManifest;
  reader: Reader<any, any>;
  normalizer: Normalizer;
  validator: Validator;
  mapper: Mapper;
}

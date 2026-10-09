import { StrategicSignal } from './StrategicSignal';

export interface ISignalRepository {
  store(signal: StrategicSignal): Promise<void>;
  find(id: string): Promise<StrategicSignal | undefined>;
  getById?(id: string): Promise<StrategicSignal | undefined>;
  exists(id: string): Promise<boolean>;
  list(): Promise<StrategicSignal[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

import { StrategicSignal } from '../domain/StrategicSignal';
import { ISignalRepository } from '../domain/SignalRepository';

export class InMemorySignalRepository implements ISignalRepository {
  private signals = new Map<string, StrategicSignal>();

  constructor(private tenantId: string = 'default') {}

  get currentTenantId(): string {
    return this.tenantId;
  }

  async store(signal: StrategicSignal): Promise<void> {
    const signalTenantId =
      signal.metadata && typeof signal.metadata.tenantId === 'string'
        ? signal.metadata.tenantId
        : this.tenantId;

    if (signalTenantId !== this.tenantId) {
      return;
    }

    this.signals.set(signal.id, { ...signal });
  }

  async find(id: string): Promise<StrategicSignal | undefined> {
    const item = this.signals.get(id);
    return item ? { ...item } : undefined;
  }

  async getById(id: string): Promise<StrategicSignal | undefined> {
    return this.find(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.signals.has(id);
  }

  async list(): Promise<StrategicSignal[]> {
    return Array.from(this.signals.values());
  }

  async count(): Promise<number> {
    return this.signals.size;
  }

  async clear(): Promise<void> {
    this.signals.clear();
  }
}

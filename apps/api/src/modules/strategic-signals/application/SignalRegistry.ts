import { SignalRule } from '../domain/SignalRule';

export class SignalRegistry {
  private static rules = new Map<string, SignalRule>();

  static register(rule: SignalRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`SignalRule com id "${rule.id}" já está registrado.`);
    }
    this.rules.set(rule.id, rule);
  }

  static find(id: string): SignalRule | undefined {
    return this.rules.get(id);
  }

  static list(): SignalRule[] {
    return Array.from(this.rules.values()).sort((a, b) => a.priority - b.priority);
  }

  static clear(): void {
    this.rules.clear();
  }
}

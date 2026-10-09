import { RelationshipRule } from '../domain/RelationshipRule';

export class RelationshipRegistry {
  private static rules = new Map<string, RelationshipRule>();

  static register(rule: RelationshipRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`RelationshipRule com id "${rule.id}" já está registrado.`);
    }
    this.rules.set(rule.id, rule);
  }

  static find(id: string): RelationshipRule | undefined {
    return this.rules.get(id);
  }

  static list(): RelationshipRule[] {
    return Array.from(this.rules.values()).sort((a, b) => a.priority - b.priority);
  }

  static clear(): void {
    this.rules.clear();
  }
}

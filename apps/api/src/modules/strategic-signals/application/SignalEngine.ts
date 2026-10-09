import { GraphNode } from '../../knowledge-graph/domain/GraphNode';
import { GraphEdge } from '../../knowledge-graph/domain/GraphEdge';
import { StrategicSignal } from '../domain/StrategicSignal';
import { SignalRegistry } from './SignalRegistry';
import { ISignalRepository } from '../domain/SignalRepository';

export class SignalEngine {
  constructor(
    private registry: typeof SignalRegistry,
    private repository?: ISignalRepository
  ) {}

  async generateSignals(nodes: GraphNode[], edges: GraphEdge[]): Promise<StrategicSignal[]> {
    const signalsMap = new Map<string, StrategicSignal>();
    const rules = this.registry.list();

    for (const rule of rules) {
      const start = Date.now();
      const ruleSignals = await rule.evaluate(nodes, edges);
      const duration = Date.now() - start;

      let signalsGeneratedCount = 0;

      for (const sig of ruleSignals) {
        if (!signalsMap.has(sig.id)) {
          signalsMap.set(sig.id, sig);
          signalsGeneratedCount++;

          if (this.repository) {
            await this.repository.store(sig);
          }
          
          console.log(
            JSON.stringify({
              rule: rule.id,
              signalsGenerated: 1,
              elapsedTime: duration,
              severity: sig.severity,
            })
          );
        }
      }

      if (signalsGeneratedCount === 0) {
        console.log(
          JSON.stringify({
            rule: rule.id,
            signalsGenerated: 0,
            elapsedTime: duration,
            severity: 'low',
          })
        );
      }
    }

    return Array.from(signalsMap.values());
  }
}

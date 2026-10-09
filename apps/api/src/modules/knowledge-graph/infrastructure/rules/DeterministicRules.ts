import { RelationshipRule } from '../../domain/RelationshipRule';
import { GraphNode } from '../../domain/GraphNode';
import { RelationshipResult } from '../../domain/RelationshipResult';

export class CandidateBelongsToPartyRule implements RelationshipRule {
  readonly id = 'candidate-belongs-to-party';
  readonly name = 'Candidate Belongs to Party Rule';
  readonly priority = 10;

  async evaluate(sourceNode: GraphNode, targetNode: GraphNode): Promise<RelationshipResult> {
    if (sourceNode.type === 'candidate' && targetNode.type === 'party') {
      return {
        matched: true,
        relation: 'belongs_to',
        confidence: 1.0,
        weight: 1.0,
      };
    }
    return { matched: false };
  }
}

export class CandidateReceivedVotesFromMunicipalityRule implements RelationshipRule {
  readonly id = 'candidate-received-votes-from-municipality';
  readonly name = 'Candidate Received Votes From Municipality Rule';
  readonly priority = 20;

  async evaluate(sourceNode: GraphNode, targetNode: GraphNode): Promise<RelationshipResult> {
    if (sourceNode.type === 'candidate' && targetNode.type === 'municipality') {
      return {
        matched: true,
        relation: 'received_votes_from',
        confidence: 1.0,
        weight: 1.0,
      };
    }
    return { matched: false };
  }
}

export class MunicipalityLocatedInOrganizationRule implements RelationshipRule {
  readonly id = 'municipality-located-in-organization';
  readonly name = 'Municipality Located In Organization Rule';
  readonly priority = 30;

  async evaluate(sourceNode: GraphNode, targetNode: GraphNode): Promise<RelationshipResult> {
    if (sourceNode.type === 'municipality' && targetNode.type === 'organization') {
      return {
        matched: true,
        relation: 'located_in',
        confidence: 1.0,
        weight: 1.0,
      };
    }
    return { matched: false };
  }
}

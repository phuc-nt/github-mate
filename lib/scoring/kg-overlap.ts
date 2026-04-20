import type { KnowledgeGraph, KgNode, KgLink } from "../kg/types";
import type { MatchOverlap } from "./types";

export function kgOverlap(a: KnowledgeGraph, b: KnowledgeGraph): MatchOverlap {
  const idsB = new Set(b.nodes.map((n) => n.id));
  const commonNodes: KgNode[] = a.nodes.filter((n) => idsB.has(n.id));

  const edgeKey = (l: KgLink) => `${l.source}|${l.target}|${l.relation}`;
  const edgesB = new Set(b.links.map(edgeKey));
  const commonEdges: KgLink[] = a.links.filter((l) => edgesB.has(edgeKey(l)));

  return { commonNodes, commonEdges };
}

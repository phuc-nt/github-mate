import type { KnowledgeGraph } from "./types";

export interface GraphJson {
  directed: boolean;
  multigraph: boolean;
  graph: { hyperedges: never[] };
  nodes: Array<{
    id: string;
    label: string;
    file_type: string;
    source_file: string;
    source_location?: string;
    community: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    relation: string;
    confidence: string;
    confidence_score: number;
    _src: string;
    _tgt: string;
  }>;
}

export function emitGraphJson(kg: KnowledgeGraph): GraphJson {
  return {
    directed: false,
    multigraph: false,
    graph: { hyperedges: [] },
    nodes: kg.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      file_type: n.file_type,
      source_file: n.source_file,
      source_location: n.source_location,
      community: n.community,
    })),
    links: kg.links.map((l) => ({ ...l, _src: l.source, _tgt: l.target })),
  };
}

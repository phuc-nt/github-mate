export type FileType =
  | "person"
  | "repository"
  | "language"
  | "topic"
  | "framework"
  | "organization";

export type Relation =
  | "owns"
  | "uses"
  | "stars"
  | "contributes_to"
  | "active_in"
  | "follows"
  | "member_of"
  | "tags";

export type Confidence = "EXTRACTED" | "INFERRED" | "AMBIGUOUS";

export interface KgNode {
  id: string;
  label: string;
  file_type: FileType;
  source_file: string;
  source_location?: string;
  community: string;
  body?: string;
}

export interface KgLink {
  source: string;
  target: string;
  relation: Relation;
  confidence: Confidence;
  confidence_score: number;
}

export interface KnowledgeGraph {
  nodes: KgNode[];
  links: KgLink[];
  markdownFiles: Map<string, string>;
  community: string;
}

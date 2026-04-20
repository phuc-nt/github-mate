import { zipSync, strToU8 } from "fflate";
import { emitGraphJson } from "./emit-graph-json";
import { emitObsidianGraphConfig } from "./emit-obsidian-config";
import type { KnowledgeGraph } from "./types";

export function packVaultZip(kg: KnowledgeGraph): Uint8Array {
  const files: Record<string, Uint8Array> = {};

  for (const [path, content] of kg.markdownFiles) {
    files[path] = strToU8(content);
  }

  files["graph.json"] = strToU8(JSON.stringify(emitGraphJson(kg), null, 2));
  files[".obsidian/graph.json"] = strToU8(
    JSON.stringify(emitObsidianGraphConfig(kg), null, 2),
  );

  return zipSync(files);
}

export function vaultAsJsonMap(kg: KnowledgeGraph): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [path, content] of kg.markdownFiles) map[path] = content;
  map["graph.json"] = JSON.stringify(emitGraphJson(kg));
  map[".obsidian/graph.json"] = JSON.stringify(emitObsidianGraphConfig(kg));
  return map;
}

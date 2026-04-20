import type { KgLink, KgNode } from "./types";

function toSnake(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/_+/g, "_");
}

function yamlString(s: string): string {
  return JSON.stringify(s);
}

export function emitMarkdown(
  node: KgNode,
  outgoing: { link: KgLink; targetLabel: string }[],
): string {
  const communitySnake = toSnake(node.community);
  const tags = [
    `wiki/${node.file_type}`,
    `wiki/EXTRACTED`,
    `community/${communitySnake}`,
  ];

  const fmLines: string[] = ["---"];
  fmLines.push(`source_file: ${yamlString(node.source_file)}`);
  fmLines.push(`type: ${yamlString(node.file_type)}`);
  fmLines.push(`community: ${yamlString(node.community)}`);
  if (node.source_location) {
    fmLines.push(`location: ${yamlString(node.source_location)}`);
  }
  fmLines.push("tags:");
  for (const t of tags) fmLines.push(`  - ${t}`);
  fmLines.push("---", "");

  fmLines.push(`# ${node.label}`, "");
  if (node.body) fmLines.push(sanitize(node.body), "");

  if (outgoing.length > 0) {
    fmLines.push("## Connections");
    for (const { link, targetLabel } of outgoing) {
      fmLines.push(
        `- [[${targetLabel}]] - \`${link.relation}\` [${link.confidence}]`,
      );
    }
    fmLines.push("");
  }

  fmLines.push(tags.map((t) => `#${t}`).join(" "), "");
  return fmLines.join("\n");
}

function sanitize(s: string): string {
  return s.replace(/<script/gi, "&lt;script").replace(/\{\{/g, "{ {");
}

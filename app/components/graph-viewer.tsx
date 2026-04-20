"use client";
import { useEffect, useRef } from "react";
import type { KgNode, KgLink } from "@/lib/kg/types";

export interface KgPayload {
  nodes: KgNode[];
  links: KgLink[];
}

export default function GraphViewer({
  kgA,
  kgB,
  overlapNodeIds,
}: {
  kgA: KgPayload;
  kgB: KgPayload;
  overlapNodeIds: string[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let destroyed = false;
    let cy: { destroy(): void } | null = null;
    (async () => {
      if (!ref.current) return;
      const { default: cytoscape } = await import("cytoscape");
      if (destroyed || !ref.current) return;
      const overlap = new Set(overlapNodeIds);
      const seen = new Set<string>();
      const elements: Array<{
        data: Record<string, unknown>;
        classes?: string;
      }> = [];

      for (const [side, kg] of [["A", kgA] as const, ["B", kgB] as const]) {
        for (const n of kg.nodes) {
          const id = n.id;
          if (seen.has(id)) continue;
          seen.add(id);
          elements.push({
            data: { id, label: n.label, type: n.file_type },
            classes: [
              `type-${n.file_type}`,
              overlap.has(id) ? "overlap" : `side-${side}`,
            ].join(" "),
          });
        }
        for (const l of kg.links) {
          elements.push({
            data: {
              id: `${side}:${l.source}->${l.target}:${l.relation}`,
              source: l.source,
              target: l.target,
              relation: l.relation,
            },
          });
        }
      }

      cy = cytoscape({
        container: ref.current,
        elements,
        style: [
          {
            selector: "node",
            style: {
              label: "data(label)",
              "font-size": 10,
              color: "#cbd5e1",
              "background-color": "#475569",
              "text-valign": "bottom",
              "text-margin-y": 4,
              width: 18,
              height: 18,
            },
          },
          {
            selector: "node.type-person",
            style: { "background-color": "#6366f1", width: 28, height: 28 },
          },
          {
            selector: "node.type-language",
            style: { "background-color": "#22c55e" },
          },
          {
            selector: "node.type-framework",
            style: { "background-color": "#eab308" },
          },
          {
            selector: "node.type-topic",
            style: { "background-color": "#38bdf8" },
          },
          {
            selector: "node.overlap",
            style: {
              "border-width": 3,
              "border-color": "#f472b6",
              "background-color": "#f472b6",
            },
          },
          {
            selector: "edge",
            style: {
              "line-color": "#334155",
              width: 1,
              "curve-style": "bezier",
              "target-arrow-shape": "triangle",
              "target-arrow-color": "#334155",
            },
          },
        ],
        layout: { name: "cose", animate: false },
      });
    })();
    return () => {
      destroyed = true;
      cy?.destroy();
    };
  }, [kgA, kgB, overlapNodeIds]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: 480,
        background: "#0f172a",
        borderRadius: 12,
        border: "1px solid #334155",
      }}
    />
  );
}

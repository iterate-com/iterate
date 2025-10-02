import z from "zod";
import type { AgentCoreEvent, AugmentedCoreReducedState } from "./agent-core-schemas.ts";

// TODO: put these in the right place
//  and fix the schemas and types
export interface AgentTraceExportMetadata {
  estateId: string;
  estateName: string;
  agentInstanceId: string;
  agentInstanceName: string;
  agentClassName: "IterateAgent" | "SlackAgent";
  debugUrl: string;
  braintrustParentSpanExportedId?: string;
  braintrustPermalink?: string;
  posthogTraceId: string;
  eventCount: number;
  fileCount: number;
}

export interface FileMetadata {
  filename: string | null;
  mimeType: string | null;
  fileSize: number | null;
}

export interface AgentTraceExport {
  version: string;
  exportedAt: string;
  metadata: AgentTraceExportMetadata;
  events: AgentCoreEvent[];
  fileMetadata: Record<string, FileMetadata>;
  reducedStateSnapshots: Record<number, AugmentedCoreReducedState>;
}

export const AgentTraceExportMetadataSchema = z.object({
  estateId: z.string(),
  estateName: z.string(),
  agentInstanceId: z.string(),
  agentInstanceName: z.string(),
  agentClassName: z.enum(["IterateAgent", "SlackAgent"]),
  debugUrl: z.string(),
  braintrustParentSpanExportedId: z.string().optional(),
  braintrustPermalink: z.string().optional(),
  posthogTraceId: z.string(),
  eventCount: z.number(),
  fileCount: z.number(),
});

export const FileMetadataSchema = z.object({
  filename: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSize: z.number().nullable(),
});

export const AgentTraceExportSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  metadata: AgentTraceExportMetadataSchema,
  events: z.array(z.any()),
  fileMetadata: z.record(z.string(), FileMetadataSchema),
  reducedStateSnapshots: z.record(z.string(), z.any()),
});

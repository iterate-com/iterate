import z from "zod";
import type { AgentCoreEvent, AugmentedCoreReducedState } from "./agent-core-schemas.ts";

export interface AgentTraceExportMetadata {
  estateId: string;
  estateName: string;
  agentInstanceId: string;
  agentInstanceName: string;
  agentClassName: string;
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
  agentClassName: z.string(),
  debugUrl: z.string(),
  braintrustParentSpanExportedId: z.string().optional(),
  braintrustPermalink: z.string().optional(),
  posthogTraceId: z.string(),
  eventCount: z.number(),
  fileCount: z.number(),
});

export const FileMetadataSchema = z.object({
  filename: z.string(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
});

export const AgentTraceExportSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  metadata: AgentTraceExportMetadataSchema,
  events: z.array(z.any()),
  fileMetadata: z.record(z.string(), FileMetadataSchema),
  reducedStateSnapshots: z.record(z.string(), z.any()),
});

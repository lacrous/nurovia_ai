/**
 * Tool use / function calling for the council.
 * Each tool defines a name, description, JSON schema for arguments, and an execute function.
 * When the council emits a tool call, we execute it locally and feed the result back as a tool message.
 */

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>;
}

const tools: ToolDefinition[] = [];

export function registerTool(tool: ToolDefinition) {
  tools.push(tool);
}

export function getTools(): ToolDefinition[] {
  return tools;
}

export function getToolByName(name: string): ToolDefinition | undefined {
  return tools.find((t) => t.name === name);
}

export async function executeTool(call: ToolCall, signal?: AbortSignal): Promise<ToolResult> {
  const tool = getToolByName(call.name);
  if (!tool) {
    return {
      toolCallId: call.id,
      name: call.name,
      result: null,
      error: `Tool ${call.name} is not registered`,
    };
  }
  try {
    const result = await tool.execute(call.arguments, signal);
    return { toolCallId: call.id, name: call.name, result };
  } catch (err) {
    return {
      toolCallId: call.id,
      name: call.name,
      result: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Format tool definitions as a system prompt section so the model knows what's available.
 * Called by withSystemAndContext when tools are enabled.
 */
export function toolsAsSystemPrompt(): string {
  if (tools.length === 0) return "";
  const lines = ["[Available tools]"];
  for (const t of tools) {
    lines.push(`- ${t.name}: ${t.description}`);
    const params = Object.entries(t.parameters.properties);
    for (const [name, schema] of params) {
      lines.push(`    · ${name} (${schema.type}): ${schema.description}`);
    }
  }
  lines.push("");
  lines.push('To use a tool, emit a JSON block of the form: ```json\n{"tool": "<name>", "arguments": {...}}\n```');
  return lines.join("\n");
}
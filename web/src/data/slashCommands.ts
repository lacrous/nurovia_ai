import { Bug, ScanSearch, FlaskConical, Wrench, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

export interface BuiltinSlashCommand {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  template: string;
  builtin: true;
}

export interface CustomSlashCommand {
  id: string;
  label: string;
  description: string;
  template: string;
  builtin: false;
  emoji?: string;
}

export type SlashCommand = BuiltinSlashCommand | CustomSlashCommand;

export const BUILTIN_SLASH_COMMANDS: BuiltinSlashCommand[] = [
  {
    id: "fix",
    label: "/fix",
    description: "Diagnose and fix a bug",
    icon: Bug,
    template: "Diagnose and fix this bug. Ask for the stack trace and minimal repro if missing:\n\n",
    builtin: true,
  },
  {
    id: "explain",
    label: "/explain",
    description: "Explain what this code does",
    icon: ScanSearch,
    template: "Explain what this code does, line by line. Surface non-obvious behavior:\n\n",
    builtin: true,
  },
  {
    id: "test",
    label: "/test",
    description: "Write tests for the code",
    icon: FlaskConical,
    template: "Write thorough tests for the following code. Cover edge cases and error paths:\n\n",
    builtin: true,
  },
  {
    id: "refactor",
    label: "/refactor",
    description: "Refactor for clarity / perf",
    icon: Wrench,
    template: "Refactor this for clarity and performance. Show before/after:\n\n",
    builtin: true,
  },
  {
    id: "review",
    label: "/review",
    description: "Review like a senior engineer",
    icon: ShieldCheck,
    template: "Review the following code like a senior engineer. Call out issues, suggest improvements, and explain why:\n\n",
    builtin: true,
  },
  {
    id: "summarize",
    label: "/summarize",
    description: "Summarize what the council said",
    icon: Sparkles,
    template: "Summarize what the council said so far. Highlight disagreements:\n",
    builtin: true,
  },
];

const CUSTOM_KEY = "nurovia-ai-custom-commands";

export function getCustomCommands(): CustomSlashCommand[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomSlashCommand[];
  } catch {
    return [];
  }
}

export function saveCustomCommands(cmds: CustomSlashCommand[]) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(cmds));
  } catch {
    // ignore
  }
}

export function getAllSlashCommands(): SlashCommand[] {
  return [...BUILTIN_SLASH_COMMANDS, ...getCustomCommands()];
}
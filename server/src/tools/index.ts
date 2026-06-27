import { TOOLS } from './definitions.js';
import * as taskTools from './impl/tasks.js';
import * as fileTools from './impl/files.js';
import * as reportTools from './impl/reports.js';
import * as candidateTools from './impl/candidates.js';
import * as dashboardTools from './impl/dashboard.js';

const registry: Record<string, (args: Record<string, unknown>) => unknown> = {
  createTask: taskTools.createTask,
  listTasks: taskTools.listTasks,
  updateTaskStatus: taskTools.updateTaskStatus,
  listFiles: fileTools.listFiles,
  readFile: fileTools.readFile,
  organizeFiles: fileTools.organizeFiles,
  createReport: reportTools.createReport,
  listReports: reportTools.listReports,
  generateExcelReport: reportTools.generateExcelReport,
  createCandidate: candidateTools.createCandidate,
  listCandidates: candidateTools.listCandidates,
  getDashboardMetrics: dashboardTools.getDashboardMetrics,
};

export { TOOLS };

export function getOllamaTools(): { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }[] {
  return TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export function executeTool(name: string, args: Record<string, unknown>): unknown {
  const fn = registry[name];
  if (!fn) {
    throw new Error(`Ferramenta desconhecida: ${name}`);
  }
  return fn(args);
}

export function getToolDescriptionsForPrompt(): string {
  return TOOLS.map((tool) => {
    const params = Object.entries(tool.parameters.properties)
      .map(([key, cfg]) => {
        const extra = cfg.enum ? ` (valores: ${cfg.enum.join(', ')})` : '';
        return `${key}: ${cfg.type}${extra}`;
      })
      .join(', ');
    return `- ${tool.name}(${params}) — ${tool.description}`;
  }).join('\n');
}

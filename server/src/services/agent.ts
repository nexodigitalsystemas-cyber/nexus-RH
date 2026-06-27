import { chatWithTools, getOllamaConfig } from './ollama.js';
import { executeTool, getOllamaTools } from '../tools/index.js';
import type { ChatMessage, ToolCall } from '../types/index.js';

interface AgentRequest {
  messages: ChatMessage[];
}

function buildSystemPrompt(): string {
  return `Você é o Nexus AI, um assistente executivo autônomo. Você executa ações reais no sistema através de ferramentas.

Regras:
- Sempre responda em português do Brasil.
- SEMPRE que o usuário pedir para criar, listar, atualizar, gerar, organizar ou analisar algo, USE uma ferramenta.
- NUNCA escreva JSON ou código no texto da resposta; use as ferramentas disponíveis.
- NUNCA invente resultados. Sempre execute a ferramenta antes de afirmar que algo foi feito.
- Seja objetivo e amigável nas respostas finais.
`;
}

function formatActionResponse(call: ToolCall, result: unknown): string {
  const args = call.arguments;

  if (call.name === 'createTask' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `✅ Tarefa criada com sucesso!\n\n**${r.title}** (#${r.id})\nCategoria: ${r.category} · Prioridade: ${r.priority} · Status: ${r.status}`;
  }

  if (call.name === 'updateTaskStatus' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `✅ Status da tarefa #${r.id} atualizado para **${r.status}**.`;
  }

  if (call.name === 'createCandidate' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `✅ Candidato **${r.name}** registrado no sistema (ID #${r.id}).`;
  }

  if (call.name === 'generateExcelReport' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `📊 Relatório Excel gerado: **${r.filePath || args.filename}** (${r.fileSize || 0} bytes).`;
  }

  if (call.name === 'createReport' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `📄 Relatório **${r.name}** registrado (ID #${r.id}).`;
  }

  if (call.name === 'organizeFiles' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `📁 Arquivos organizados de /${r.sourceFolder} para /${r.targetFolder}. ${r.movedCount || 0} arquivo(s) movido(s).`;
  }

  if (call.name === 'listTasks' && Array.isArray(result)) {
    if (result.length === 0) return 'Não encontrei tarefas com esses critérios.';
    const lines = result.slice(0, 10).map((t: Record<string, unknown>) => `• #${t.id} ${t.title} (${t.status})`);
    return `Encontrei ${result.length} tarefa(s):\n\n${lines.join('\n')}`;
  }

  if (call.name === 'listFiles' && Array.isArray(result)) {
    if (result.length === 0) return 'Não encontrei arquivos com esses critérios.';
    const lines = result.slice(0, 10).map((f: Record<string, unknown>) => `• ${f.file_name} (${f.folder})`);
    return `Encontrei ${result.length} arquivo(s):\n\n${lines.join('\n')}`;
  }

  if (call.name === 'listReports' && Array.isArray(result)) {
    if (result.length === 0) return 'Não encontrei relatórios.';
    const lines = result.slice(0, 10).map((r: Record<string, unknown>) => `• ${r.name} (${r.type})`);
    return `Encontrei ${result.length} relatório(s):\n\n${lines.join('\n')}`;
  }

  if (call.name === 'listCandidates' && Array.isArray(result)) {
    if (result.length === 0) return 'Não encontrei candidatos.';
    const lines = result.slice(0, 10).map((c: Record<string, unknown>) => `• ${c.name} (${c.email || 'sem email'})`);
    return `Encontrei ${result.length} candidato(s):\n\n${lines.join('\n')}`;
  }

  if (call.name === 'getDashboardMetrics' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `📊 Métricas do dashboard:\n• Tarefas concluídas: ${r.tasksCompleted}/${r.tasksTotal}\n• Tarefas pendentes: ${r.pendingTasks}\n• Arquivos processados: ${r.filesProcessed}\n• Tempo economizado: ${r.timeSaved}h`;
  }

  if (call.name === 'readFile' && result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    return `📄 Conteúdo de **${r.file_name}**:\n\n${String(r.extracted_text || '').slice(0, 2000)}`;
  }

  return `Ação executada: ${call.name}.`;
}

export async function runAgent(request: AgentRequest): Promise<{ response: string; actions: ToolCall[] }> {
  const config = getOllamaConfig();
  const tools = getOllamaTools();
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...request.messages,
  ];

  const reply = await chatWithTools(config, messages, tools);

  if (!reply.tool_calls || reply.tool_calls.length === 0) {
    return {
      response: reply.content || 'Desculpe, não entendi. Pode reformular?',
      actions: [],
    };
  }

  const actions: ToolCall[] = [];
  const responses: string[] = [];

  for (const call of reply.tool_calls) {
    actions.push({ name: call.function.name, arguments: call.function.arguments });

    try {
      const result = executeTool(call.function.name, call.function.arguments);
      responses.push(formatActionResponse({ name: call.function.name, arguments: call.function.arguments }, result));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      responses.push(`❌ Erro ao executar ${call.function.name}: ${message}`);
    }
  }

  return {
    response: responses.join('\n\n'),
    actions,
  };
}

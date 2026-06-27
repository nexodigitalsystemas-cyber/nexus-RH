export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'createTask',
    description: 'Cria uma nova tarefa no dashboard do Nexus. Use quando o usuário pedir para criar, adicionar ou registrar uma tarefa.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título curto e claro da tarefa' },
        description: { type: 'string', description: 'Descrição detalhada do que deve ser feito' },
        category: { type: 'string', description: 'Departamento', enum: ['RH', 'Financeiro', 'Comercial', 'Operacional'] },
        priority: { type: 'string', description: 'Prioridade', enum: ['low', 'medium', 'high', 'urgent'] },
        type: { type: 'string', description: 'Tipo da tarefa', enum: ['cv-analysis', 'invoice-processing', 'contract-review', 'report-generation', 'file-organization', 'custom'] },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'listTasks',
    description: 'Lista tarefas do dashboard. Use para responder quantas tarefas existem, quais estão pendentes, ou buscar tarefas por status/categoria.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filtrar por status', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
        category: { type: 'string', description: 'Filtrar por categoria', enum: ['RH', 'Financeiro', 'Comercial', 'Operacional'] },
        limit: { type: 'number', description: 'Máximo de resultados' },
      },
    },
  },
  {
    name: 'updateTaskStatus',
    description: 'Altera o status de uma tarefa existente. Use quando o usuário pedir para marcar como concluída, iniciar, cancelar, etc.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID da tarefa' },
        status: { type: 'string', description: 'Novo status', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'createReport',
    description: 'Registra um relatório gerado no sistema. Use após gerar um arquivo de relatório real.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do arquivo do relatório' },
        type: { type: 'string', description: 'Formato', enum: ['excel', 'pdf'] },
        description: { type: 'string', description: 'Descrição do conteúdo' },
        file_path: { type: 'string', description: 'Caminho absoluto ou relativo do arquivo gerado' },
        file_size: { type: 'number', description: 'Tamanho em bytes' },
      },
      required: ['name', 'type', 'description'],
    },
  },
  {
    name: 'listReports',
    description: 'Lista relatórios já gerados.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filtrar por formato', enum: ['excel', 'pdf'] },
        limit: { type: 'number', description: 'Máximo de resultados' },
      },
    },
  },
  {
    name: 'listFiles',
    description: 'Lista arquivos monitorados pelo Nexus. Use para responder quais arquivos existem, onde estão, etc.',
    parameters: {
      type: 'object',
      properties: {
        folder: { type: 'string', description: 'Pasta/categoria para filtrar' },
        search: { type: 'string', description: 'Termo de busca por nome ou conteúdo extraído' },
        limit: { type: 'number', description: 'Máximo de resultados' },
      },
    },
  },
  {
    name: 'readFile',
    description: 'Lê o conteúdo/texto extraído de um arquivo monitorado. Use para analisar currículos, contratos, planilhas, etc.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID do arquivo no banco de dados' },
      },
      required: ['id'],
    },
  },
  {
    name: 'organizeFiles',
    description: 'Move arquivos de uma pasta para outra no filesystem e atualiza o banco. Use quando o usuário pedir para organizar, classificar ou mover arquivos.',
    parameters: {
      type: 'object',
      properties: {
        sourceFolder: { type: 'string', description: 'Pasta de origem (ex: downloads)' },
        targetFolder: { type: 'string', description: 'Pasta de destino (ex: RH, Financeiro, Comercial, Operacional)' },
        filePattern: { type: 'string', description: 'Padrão opcional de nome para filtrar arquivos (ex: .pdf, CV)' },
      },
      required: ['sourceFolder', 'targetFolder'],
    },
  },
  {
    name: 'createCandidate',
    description: 'Registra um candidato extraído de um currículo. Use após analisar um CV.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome completo' },
        email: { type: 'string', description: 'E-mail' },
        phone: { type: 'string', description: 'Telefone' },
        skills: { type: 'string', description: 'Habilidades técnicas separadas por vírgula' },
        experience: { type: 'string', description: 'Resumo da experiência profissional' },
        source_file: { type: 'string', description: 'Nome do arquivo de origem' },
      },
      required: ['name'],
    },
  },
  {
    name: 'listCandidates',
    description: 'Lista candidatos cadastrados.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Buscar por nome, email ou habilidades' },
        limit: { type: 'number', description: 'Máximo de resultados' },
      },
    },
  },
  {
    name: 'getDashboardMetrics',
    description: 'Obtém métricas resumidas do dashboard: tarefas concluídas, tempo economizado, arquivos processados, pendentes.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'generateExcelReport',
    description: 'Gera um arquivo Excel real no filesystem com os dados fornecidos e registra no banco. Use quando o usuário pedir um relatório em Excel.',
    parameters: {
      type: 'object',
      properties: {
        filename: { type: 'string', description: 'Nome do arquivo (ex: relatorio_vendas.xlsx)' },
        title: { type: 'string', description: 'Título do relatório' },
        sheetName: { type: 'string', description: 'Nome da aba' },
        headers: { type: 'array', description: 'Lista de cabeçalhos das colunas', items: { type: 'string' } },
        rows: { type: 'array', description: 'Lista de linhas (cada linha é um array de valores)', items: { type: 'array' } },
      },
      required: ['filename', 'title', 'headers', 'rows'],
    },
  },
];

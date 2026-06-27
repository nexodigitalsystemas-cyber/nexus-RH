import type { Task, ProcessedFile, Candidate } from '@/types';

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Analise de curriculos - Desenvolvedor React',
    description: 'Analisar 15 curriculos recebidos para a vaga de Desenvolvedor Frontend React com foco em TypeScript e Next.js',
    status: 'in_progress',
    type: 'cv-analysis',
    priority: 'high',
    category: 'RH',
    file_name: 'CVs_Desenvolvedor_React.zip',
    created_at: '2025-06-27T10:30:00Z',
    updated_at: '2025-06-27T14:20:00Z',
  },
  {
    id: 2,
    title: 'Conciliacao vendas iFood Junho',
    description: 'Conciliar extrato de vendas do iFood com extrato bancario do Nubank - periodo de 01 a 30 de junho',
    status: 'pending',
    type: 'invoice-processing',
    priority: 'urgent',
    category: 'Financeiro',
    file_name: 'iFood_Junho_2025.xlsx',
    created_at: '2025-06-27T09:15:00Z',
    updated_at: '2025-06-27T09:15:00Z',
  },
  {
    id: 3,
    title: 'Revisao contrato de prestacao de servicos',
    description: 'Revisar clausulas do contrato de prestacao de servicos com a empresa de limpeza predial',
    status: 'completed',
    type: 'contract-review',
    priority: 'medium',
    category: 'Operacional',
    file_name: 'Contrato_Limpeza_2025.docx',
    created_at: '2025-06-26T16:00:00Z',
    updated_at: '2025-06-27T08:45:00Z',
  },
  {
    id: 4,
    title: 'Gerar relatorio de vendas Q2 2025',
    description: 'Consolidar dados de vendas do segundo trimestre e gerar relatorio em Excel com graficos e analise',
    status: 'pending',
    type: 'report-generation',
    priority: 'medium',
    category: 'Comercial',
    file_name: 'Vendas_Q2_2025.xlsx',
    created_at: '2025-06-26T14:30:00Z',
    updated_at: '2025-06-26T14:30:00Z',
  },
  {
    id: 5,
    title: 'Organizar documentos fiscais NFs',
    description: 'Classificar e organizar 47 notas fiscais de servico do mes de junho por categoria e valor',
    status: 'in_progress',
    type: 'file-organization',
    priority: 'high',
    category: 'Financeiro',
    file_name: 'NFs_Junho_2025.zip',
    created_at: '2025-06-26T11:00:00Z',
    updated_at: '2025-06-27T13:10:00Z',
  },
  {
    id: 6,
    title: 'Analise de curriculo - Product Designer',
    description: 'Analisar curriculo e portfolio do candidato para vaga de Product Designer Senior',
    status: 'completed',
    type: 'cv-analysis',
    priority: 'low',
    category: 'RH',
    file_name: 'CV_Anna_Beatriz.pdf',
    created_at: '2025-06-25T09:00:00Z',
    updated_at: '2025-06-25T11:30:00Z',
  },
  {
    id: 7,
    title: 'Processamento de boletos vencidos',
    description: 'Identificar boletos vencidos no mes e gerar relatorio para envio ao setor de cobranca',
    status: 'pending',
    type: 'custom',
    priority: 'urgent',
    category: 'Financeiro',
    file_name: 'Boletos_Vencidos.csv',
    created_at: '2025-06-25T08:30:00Z',
    updated_at: '2025-06-25T08:30:00Z',
  },
  {
    id: 8,
    title: 'Relatorio de despesas operacionais',
    description: 'Consolidar despesas operacionais do mes de junho e categorizar por tipo de gasto',
    status: 'completed',
    type: 'report-generation',
    priority: 'medium',
    category: 'Operacional',
    file_name: 'Despesas_Junho.xlsx',
    created_at: '2025-06-24T15:00:00Z',
    updated_at: '2025-06-24T17:20:00Z',
  },
];

export const mockFiles: ProcessedFile[] = [
  {
    id: 1,
    file_name: 'CV_Maria_Silva.pdf',
    file_path: '/documents/cvs/CV_Maria_Silva.pdf',
    file_type: 'PDF',
    file_size: 245760,
    extracted_text: 'Curriculo de Maria Silva - Desenvolvedora Full Stack com 5 anos de experiencia...',
    classification: 'Curriculo',
    metadata: '{"pages": 3, "language": "pt-BR"}',
    created_at: '2025-06-27T10:30:00Z',
  },
  {
    id: 2,
    file_name: 'NFs_Junho_2025.xlsx',
    file_path: '/documents/financeiro/NFs_Junho_2025.xlsx',
    file_type: 'XLSX',
    file_size: 524288,
    extracted_text: 'Planilha com 47 notas fiscais do mes de junho de 2025',
    classification: 'Planilha Fiscal',
    metadata: '{"sheets": 3, "rows": 47}',
    created_at: '2025-06-27T09:15:00Z',
  },
  {
    id: 3,
    file_name: 'Contrato_Limpeza_2025.docx',
    file_path: '/documents/contratos/Contrato_Limpeza_2025.docx',
    file_type: 'DOCX',
    file_size: 180224,
    extracted_text: 'Contrato de prestacao de servicos de limpeza predial - vigencia 2025',
    classification: 'Contrato',
    metadata: '{"pages": 8, "language": "pt-BR"}',
    created_at: '2025-06-26T16:00:00Z',
  },
  {
    id: 4,
    file_name: 'iFood_Extrato_Junho.csv',
    file_path: '/documents/financeiro/iFood_Extrato_Junho.csv',
    file_type: 'CSV',
    file_size: 102400,
    extracted_text: 'Extrato de vendas iFood - 01 a 30 de junho de 2025',
    classification: 'Extrato Bancario',
    metadata: '{"rows": 342, "delimiter": ","}',
    created_at: '2025-06-26T14:00:00Z',
  },
  {
    id: 5,
    file_name: 'Vendas_Q2_2025.xlsx',
    file_path: '/documents/comercial/Vendas_Q2_2025.xlsx',
    file_type: 'XLSX',
    file_size: 786432,
    extracted_text: 'Relatorio consolidado de vendas do segundo trimestre de 2025',
    classification: 'Relatorio Comercial',
    metadata: '{"sheets": 5, "rows": 1280}',
    created_at: '2025-06-26T11:30:00Z',
  },
  {
    id: 6,
    file_name: 'Manual_Integracao_API.pdf',
    file_path: '/documents/tecnicos/Manual_Integracao_API.pdf',
    file_type: 'PDF',
    file_size: 1572864,
    extracted_text: 'Manual tecnico de integracao com a API REST da plataforma',
    classification: 'Documentacao Tecnica',
    metadata: '{"pages": 24, "language": "pt-BR"}',
    created_at: '2025-06-25T10:00:00Z',
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: 1,
    name: 'Ana Paula Mendes',
    email: 'ana.mendes@email.com',
    phone: '(11) 98765-4321',
    skills: 'React, Node.js, TypeScript, PostgreSQL, AWS',
    experience: '5 anos como Desenvolvedora Full Stack em startups de tecnologia',
    source_file: 'CV_Ana_Paula_Mendes.pdf',
    created_at: '2025-06-27T10:30:00Z',
  },
  {
    id: 2,
    name: 'Carlos Eduardo Lima',
    email: 'carlos.lima@email.com',
    phone: '(11) 91234-5678',
    skills: 'Python, Django, Machine Learning, Docker, Kubernetes',
    experience: '7 anos em desenvolvimento backend e 2 anos em ML',
    source_file: 'CV_Carlos_Lima.pdf',
    created_at: '2025-06-27T10:35:00Z',
  },
  {
    id: 3,
    name: 'Beatriz Santos Oliveira',
    email: 'beatriz.santos@email.com',
    phone: '(21) 99876-5432',
    skills: 'Figma, Adobe XD, Design System, User Research, Prototipagem',
    experience: '4 anos como Product Designer em empresas de SaaS',
    source_file: 'CV_Beatriz_Santos.pdf',
    created_at: '2025-06-26T09:15:00Z',
  },
  {
    id: 4,
    name: 'Ricardo Ferreira',
    email: 'ricardo.ferreira@email.com',
    phone: '(31) 98765-1234',
    skills: 'Java, Spring Boot, Microservices, Kafka, MongoDB',
    experience: '8 anos em desenvolvimento enterprise e lideranca tecnica',
    source_file: 'CV_Ricardo_Ferreira.pdf',
    created_at: '2025-06-25T14:20:00Z',
  },
];

export const chartData = [
  { day: 'Seg', tasks: 12 },
  { day: 'Ter', tasks: 19 },
  { day: 'Qua', tasks: 15 },
  { day: 'Qui', tasks: 22 },
  { day: 'Sex', tasks: 28 },
  { day: 'Sab', tasks: 8 },
  { day: 'Dom', tasks: 5 },
];

export const categoryPerformance = [
  { category: 'RH', rate: 85, gradient: 'from-[#6366F1] to-[#818CF8]' },
  { category: 'Financeiro', rate: 62, gradient: 'from-[#3B82F6] to-[#6366F1]' },
  { category: 'Comercial', rate: 70, gradient: 'from-[#8B5CF6] to-[#6366F1]' },
  { category: 'Operacional', rate: 91, gradient: 'from-[#10B981] to-[#3B82F6]' },
];

export const dashboardMetrics = {
  tasksCompleted: 12,
  tasksTotal: 15,
  efficiency: 87,
  efficiencyTrend: 12,
  timeSaved: 4.2,
  timeSavedTrend: 2.5,
  filesProcessed: 156,
  filesTrend: 23,
  pendingTasks: 18,
  pendingBreakdown: '8 urgentes · 6 medias · 4 baixas',
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluida',
    cancelled: 'Cancelada',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    completed: '#10B981',
    cancelled: '#EF4444',
  };
  return colors[status] || '#64748B';
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'cv-analysis': 'Analise de CV',
    'invoice-processing': 'Processamento de NF',
    'contract-review': 'Revisao de Contrato',
    'report-generation': 'Geracao de Relatorio',
    'file-organization': 'Organizacao de Arquivos',
    custom: 'Personalizado',
  };
  return labels[type] || type;
}

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'cv-analysis': '#6366F1',
    'invoice-processing': '#F59E0B',
    'contract-review': '#3B82F6',
    'report-generation': '#8B5CF6',
    'file-organization': '#10B981',
    custom: '#64748B',
  };
  return colors[type] || '#64748B';
}

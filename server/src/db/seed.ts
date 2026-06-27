import { db } from './connection.js';

const TASKS = [
  {
    title: 'Analise de curriculos - Desenvolvedor React',
    description: 'Analisar 15 curriculos recebidos para a vaga de Desenvolvedor Frontend React',
    status: 'in_progress',
    type: 'cv-analysis',
    priority: 'high',
    category: 'RH',
    file_name: 'CVs_Desenvolvedor_React.zip',
  },
  {
    title: 'Conciliacao vendas iFood Junho',
    description: 'Conciliar extrato de vendas do iFood com extrato bancario do Nubank',
    status: 'pending',
    type: 'invoice-processing',
    priority: 'urgent',
    category: 'Financeiro',
    file_name: 'iFood_Junho_2025.xlsx',
  },
  {
    title: 'Revisao contrato de prestacao de servicos',
    description: 'Revisar clausulas do contrato de prestacao de servicos com empresa de limpeza',
    status: 'completed',
    type: 'contract-review',
    priority: 'medium',
    category: 'Operacional',
    file_name: 'Contrato_Limpeza_2025.docx',
  },
  {
    title: 'Gerar relatorio de vendas Q2 2025',
    description: 'Consolidar dados de vendas do segundo trimestre',
    status: 'pending',
    type: 'report-generation',
    priority: 'medium',
    category: 'Comercial',
    file_name: 'Vendas_Q2_2025.xlsx',
  },
  {
    title: 'Organizar documentos fiscais NFs',
    description: 'Classificar e organizar 47 notas fiscais de servico',
    status: 'in_progress',
    type: 'file-organization',
    priority: 'high',
    category: 'Financeiro',
    file_name: 'NFs_Junho_2025.zip',
  },
  {
    title: 'Analise de curriculo - Product Designer',
    description: 'Analisar curriculo e portfolio do candidato',
    status: 'completed',
    type: 'cv-analysis',
    priority: 'low',
    category: 'RH',
    file_name: 'CV_Anna_Beatriz.pdf',
  },
  {
    title: 'Processamento de boletos vencidos',
    description: 'Identificar boletos vencidos no mes',
    status: 'pending',
    type: 'custom',
    priority: 'urgent',
    category: 'Financeiro',
    file_name: 'Boletos_Vencidos.csv',
  },
  {
    title: 'Relatorio de despesas operacionais',
    description: 'Consolidar despesas operacionais do mes de junho',
    status: 'completed',
    type: 'report-generation',
    priority: 'medium',
    category: 'Operacional',
    file_name: 'Despesas_Junho.xlsx',
  },
];

const FILES = [
  { file_name: 'CV_Maria_Silva.pdf', file_path: '/documents/cvs/CV_Maria_Silva.pdf', file_type: 'PDF', file_size: 245760, extracted_text: 'Curriculo de Maria Silva - Desenvolvedora Full Stack...', classification: 'Curriculo', metadata: '{"pages":3}', folder: 'RH', category: 'RH' },
  { file_name: 'NFs_Junho_2025.xlsx', file_path: '/documents/financeiro/NFs_Junho_2025.xlsx', file_type: 'XLSX', file_size: 524288, extracted_text: 'Planilha com 47 notas fiscais', classification: 'Planilha Fiscal', metadata: '{"sheets":3,"rows":47}', folder: 'Financeiro', category: 'Financeiro' },
  { file_name: 'Contrato_Limpeza_2025.docx', file_path: '/documents/contratos/Contrato_Limpeza_2025.docx', file_type: 'DOCX', file_size: 180224, extracted_text: 'Contrato de prestacao de servicos de limpeza', classification: 'Contrato', metadata: '{"pages":8}', folder: 'Operacional', category: 'Operacional' },
  { file_name: 'iFood_Extrato_Junho.csv', file_path: '/documents/financeiro/iFood_Extrato_Junho.csv', file_type: 'CSV', file_size: 102400, extracted_text: 'Extrato de vendas iFood', classification: 'Extrato Bancario', metadata: '{"rows":342}', folder: 'Financeiro', category: 'Financeiro' },
  { file_name: 'Vendas_Q2_2025.xlsx', file_path: '/documents/comercial/Vendas_Q2_2025.xlsx', file_type: 'XLSX', file_size: 786432, extracted_text: 'Relatorio consolidado de vendas', classification: 'Relatorio Comercial', metadata: '{"sheets":5,"rows":1280}', folder: 'Comercial', category: 'Comercial' },
  { file_name: 'Manual_Integracao_API.pdf', file_path: '/documents/tecnicos/Manual_Integracao_API.pdf', file_type: 'PDF', file_size: 1572864, extracted_text: 'Manual tecnico de integracao', classification: 'Documentacao Tecnica', metadata: '{"pages":24}', folder: 'Operacional', category: 'unclassified' },
];

const REPORTS = [
  { name: 'Relatorio_Vendas_Junho_2025.xlsx', type: 'excel', status: 'pronto', description: 'Relatorio completo de vendas do mes de junho', file_path: '/reports/Relatorio_Vendas_Junho_2025.xlsx', file_size: 250880 },
  { name: 'Analise_CVs_Desenvolvedores.pdf', type: 'pdf', status: 'pronto', description: 'Analise comparativa de curriculos', file_path: '/reports/Analise_CVs_Desenvolvedores.pdf', file_size: 193536 },
  { name: 'Conciliacao_Bancaria_Q2.xlsx', type: 'excel', status: 'pronto', description: 'Conciliacao de extratos bancarios', file_path: '/reports/Conciliacao_Bancaria_Q2.xlsx', file_size: 524288 },
  { name: 'Resumo_Contratos_Fornecedores.pdf', type: 'pdf', status: 'gerando', description: 'Resumo de contratos com fornecedores', file_path: null, file_size: 0 },
  { name: 'NFs_Entrada_Junho.xlsx', type: 'excel', status: 'erro', description: 'Notas fiscais de entrada', file_path: null, file_size: 0 },
  { name: 'Relatorio_Orcamentos_Comparativo.xlsx', type: 'excel', status: 'pronto', description: 'Comparativo de orcamentos', file_path: '/reports/Relatorio_Orcamentos_Comparativo.xlsx', file_size: 335872 },
];

const CANDIDATES = [
  { name: 'Ana Paula Mendes', email: 'ana.mendes@email.com', phone: '(11) 98765-4321', skills: 'React, Node.js, TypeScript, PostgreSQL, AWS', experience: '5 anos como Desenvolvedora Full Stack', source_file: 'CV_Ana_Paula_Mendes.pdf' },
  { name: 'Carlos Eduardo Lima', email: 'carlos.lima@email.com', phone: '(11) 91234-5678', skills: 'Python, Django, Machine Learning, Docker', experience: '7 anos em backend e 2 em ML', source_file: 'CV_Carlos_Lima.pdf' },
  { name: 'Beatriz Santos Oliveira', email: 'beatriz.santos@email.com', phone: '(21) 99876-5432', skills: 'Figma, Adobe XD, Design System, User Research', experience: '4 anos como Product Designer', source_file: 'CV_Beatriz_Santos.pdf' },
  { name: 'Ricardo Ferreira', email: 'ricardo.ferreira@email.com', phone: '(31) 98765-1234', skills: 'Java, Spring Boot, Microservices, Kafka', experience: '8 anos em desenvolvimento enterprise', source_file: 'CV_Ricardo_Ferreira.pdf' },
];

export function seedDatabase(force = false) {
  const count = db.prepare('SELECT COUNT(*) as total FROM tasks').get() as { total: number };
  if (!force && count.total > 0) {
    console.log('[db] Seed ignorado: banco já possui dados');
    return;
  }

  const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, status, type, priority, category, file_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'))
  `);

  const insertFile = db.prepare(`
    INSERT INTO files (file_name, file_path, file_type, file_size, extracted_text, classification, metadata, folder, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);

  const insertReport = db.prepare(`
    INSERT INTO reports (name, type, status, description, file_path, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);

  const insertCandidate = db.prepare(`
    INSERT INTO candidates (name, email, phone, skills, experience, source_file, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM tasks").run();
    db.prepare("DELETE FROM files").run();
    db.prepare("DELETE FROM reports").run();
    db.prepare("DELETE FROM candidates").run();

    TASKS.forEach((t, i) => insertTask.run(t.title, t.description, t.status, t.type, t.priority, t.category, t.file_name, i, i));
    FILES.forEach((f, i) => insertFile.run(f.file_name, f.file_path, f.file_type, f.file_size, f.extracted_text, f.classification, f.metadata, f.folder, f.category, i));
    REPORTS.forEach((r, i) => insertReport.run(r.name, r.type, r.status, r.description, r.file_path, r.file_size, i));
    CANDIDATES.forEach((c, i) => insertCandidate.run(c.name, c.email, c.phone, c.skills, c.experience, c.source_file, i));
  });

  tx();
  console.log('[db] Seed aplicado com sucesso');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase(true);
}

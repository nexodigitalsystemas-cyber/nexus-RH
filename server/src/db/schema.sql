-- Configurações gerais do sistema
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tarefas criadas pelo usuário ou pelo agente
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('cv-analysis', 'invoice-processing', 'contract-review', 'report-generation', 'file-organization', 'custom')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'RH' CHECK (category IN ('RH', 'Financeiro', 'Comercial', 'Operacional')),
  file_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Arquivos processados / monitorados
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  extracted_text TEXT,
  classification TEXT,
  metadata TEXT,
  folder TEXT DEFAULT 'unclassified',
  category TEXT DEFAULT 'unclassified',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'trash')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Relatórios gerados
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('excel', 'pdf')),
  status TEXT NOT NULL DEFAULT 'pronto' CHECK (status IN ('pronto', 'gerando', 'erro')),
  description TEXT,
  file_path TEXT,
  file_size INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Candidatos extraídos de currículos
CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  skills TEXT,
  experience TEXT,
  source_file TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Histórico de conversas do agente
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at);

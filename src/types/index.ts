export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type: 'cv-analysis' | 'invoice-processing' | 'contract-review' | 'report-generation' | 'file-organization' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'RH' | 'Financeiro' | 'Comercial' | 'Operacional';
  file_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessedFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  extracted_text?: string;
  classification?: string;
  metadata?: string;
  folder?: string;
  category?: 'RH' | 'Financeiro' | 'Comercial' | 'Operacional' | 'unclassified';
  status?: 'active' | 'processing' | 'trash';
  created_at: string;
}

export interface Candidate {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  skills?: string;
  experience?: string;
  source_file?: string;
  created_at: string;
}

export interface AppSettings {
  ollama_model: string;
  ollama_url: string;
  temperature: number;
  max_tokens: number;
  documents_folder: string;
  language: 'pt-BR' | 'es' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
}

export type ThemeMode = 'light' | 'dark';

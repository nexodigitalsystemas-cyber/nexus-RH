import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendAgentMessage, type AgentToolCall, type ChatMessage as ApiChatMessage } from '@/lib/api';
import {
  Paperclip,
  Send,
  Bot,
  User,
  X,
  FileText,
  Sparkles,
  FolderOpen,
  BarChart3,
  GitCompare,
  UploadCloud,
  Zap,
  Download,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FileAttachment {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  progress: number;
}

interface CVData {
  type: 'cv';
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  experiencia: string;
  formacao: string;
  habilidades: string[];
}

interface ComparisonData {
  type: 'comparison';
  title: string;
  headers: string[];
  rows: Record<string, string>[];
}

interface ReportData {
  type: 'report';
  title: string;
  filename: string;
  description: string;
}

interface TaskData {
  type: 'task';
  title: string;
  category: string;
  status: string;
  priority: string;
  taskId: string;
}

type StructuredData = CVData | ComparisonData | ReportData | TaskData;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  structuredData?: StructuredData;
  followUpActions?: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function deriveStructuredData(actions: AgentToolCall[], responseText: string): StructuredData | undefined {
  for (const action of actions) {
    const args = action.arguments;
    if (action.name === 'createTask' && args.title) {
      return {
        type: 'task',
        title: String(args.title),
        category: String(args.category || 'RH'),
        status: 'pendente',
        priority: String(args.priority || 'medium'),
        taskId: String(args.id || ''),
      };
    }
    if (action.name === 'generateExcelReport' && args.filename) {
      return {
        type: 'report',
        title: String(args.title || 'Relatório gerado'),
        filename: String(args.filename),
        description: responseText || `Arquivo ${args.filename} gerado com sucesso.`,
      };
    }
    if (action.name === 'createCandidate' && args.name) {
      return {
        type: 'cv',
        nome: String(args.name),
        email: String(args.email || ''),
        telefone: String(args.phone || ''),
        cargo: String(args.skills ? `Habilidades: ${args.skills}` : ''),
        experiencia: String(args.experience || ''),
        formacao: '',
        habilidades: args.skills ? String(args.skills).split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
    }
    if (action.name === 'organizeFiles') {
      return {
        type: 'task',
        title: `Organizar arquivos de /${args.sourceFolder || 'downloads'}`,
        category: String(args.targetFolder || 'Automacao'),
        status: 'concluida',
        priority: 'baixa',
        taskId: '',
      };
    }
  }
  return undefined;
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.includes('zip') || type.includes('compressed')) return FolderOpen;
  return FileText;
}

const PLACEHOLDERS = [
  'Digite um comando ou arraste um arquivo...',
  'Ex: "Analise este curriculo"',
  'Ex: "Gere relatorio de vendas"',
  'Ex: "Concilie vendas iFood vs Nubank"',
  'Ex: "Organize os arquivos de downloads"',
];

const WELCOME_CHIPS_ROW1 = [
  { icon: FileText, label: 'Analise este curriculo' },
  { icon: GitCompare, label: 'Concilie vendas iFood vs Nubank' },
  { icon: FolderOpen, label: 'Organize os arquivos de /downloads' },
];

const WELCOME_CHIPS_ROW2 = [
  { icon: BarChart3, label: 'Gere relatorio de vendas' },
  { icon: FileText, label: 'Resuma este contrato' },
  { icon: Sparkles, label: 'Quanto gastamos em limpeza?' },
];

/* ------------------------------------------------------------------ */
/*  Typing Indicator (isolated micro-component)                       */
/* ------------------------------------------------------------------ */

const TypingIndicator = () => (
  <div
    className="inline-flex items-center gap-1.5 px-4 py-3"
    style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px 12px 12px 4px',
    }}
  >
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: 'var(--primary)' }}
        animate={{ scale: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.15,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Structured Response Cards                                         */
/* ------------------------------------------------------------------ */

function CVAnalysisCard({ data }: { data: CVData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
      className="mt-3 overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Resultado da Analise
          </span>
        </div>
      </div>
      <div className="px-4 py-3">
        {[
          { label: 'Nome', value: data.nome },
          { label: 'Email', value: data.email },
          { label: 'Telefone', value: data.telefone },
          { label: 'Cargo', value: data.cargo },
          { label: 'Experiencia', value: data.experiencia },
          { label: 'Formacao', value: data.formacao },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-b py-2 last:border-b-0"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {row.label}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {row.value}
            </span>
          </div>
        ))}
        <div className="mt-3">
          <span className="mb-2 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Habilidades
          </span>
          <div className="flex flex-wrap gap-1.5">
            {data.habilidades.map((skill) => (
              <span
                key={skill}
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(99,102,241,0.1)',
                  color: 'var(--primary)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ComparisonTableCard({ data }: { data: ComparisonData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
      className="mt-3 overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <GitCompare size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {data.title}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--border-light)' }}>
              {data.headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-semibold uppercase"
                  style={{ color: 'var(--text-muted)', fontSize: 11 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr
                key={i}
                className="border-b last:border-b-0 transition-colors"
                style={{ borderColor: 'var(--border-light)' }}
              >
                {data.headers.map((h) => (
                  <td key={h} className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function ReportCard({ data }: { data: ReportData }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
      className="mt-3 flex items-center gap-4 p-4"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
      >
        <CheckCircle2 size={24} style={{ color: 'var(--primary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {data.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {data.description}
        </p>
      </div>
      <button
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
        style={{ backgroundColor: 'var(--primary)' }}
        onClick={() => alert('Download iniciado: ' + data.filename)}
      >
        <Download size={14} />
        Baixar
      </button>
    </motion.div>
  );
}

function TaskNotificationCard({ data }: { data: TaskData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
      className="mt-3 p-4"
      style={{
        backgroundColor: 'rgba(16,185,129,0.05)',
        borderLeft: '3px solid var(--success)',
        borderRadius: '0 12px 12px 0',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Zap size={16} style={{ color: 'var(--warning)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
          Tarefa criada automaticamente
        </span>
      </div>
      <p className="mb-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        &ldquo;{data.title}&rdquo;
      </p>
      <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {data.category} &middot; {data.status} &middot; {data.priority} prioridade
      </p>
      <button
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          backgroundColor: 'rgba(99,102,241,0.1)',
          color: 'var(--primary)',
        }}
        onClick={() => (window.location.href = `/tarefas?id=${data.taskId}`)}
      >
        Ver Tarefa
      </button>
    </motion.div>
  );
}

function StructuredResponse({ data }: { data: StructuredData }) {
  switch (data.type) {
    case 'cv':
      return <CVAnalysisCard data={data} />;
    case 'comparison':
      return <ComparisonTableCard data={data} />;
    case 'report':
      return <ReportCard data={data} />;
    case 'task':
      return <TaskNotificationCard data={data} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Agente() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState('');
  const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef(0);

  const hasMessages = messages.length > 0;

  /* Auto-scroll */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* Placeholder cycling with typing animation */
  useEffect(() => {
    if (!isTypingPlaceholder) return;
    const fullText = PLACEHOLDERS[placeholderIndex];
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      charIndex++;
      setPlaceholderText(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length) {
        clearInterval(typeInterval);
        setTimeout(() => {
          setIsTypingPlaceholder(false);
          setTimeout(() => {
            setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
            setPlaceholderText('');
            setIsTypingPlaceholder(true);
          }, 1500);
        }, 2000);
      }
    }, 50);
    return () => clearInterval(typeInterval);
  }, [placeholderIndex, isTypingPlaceholder]);

  /* Call real AI agent backend */
  const handleAgentResponse = useCallback(
    async (userText: string, _userAttachments: FileAttachment[]) => {
      setIsTyping(true);
      scrollToBottom();

      try {
        const history: ApiChatMessage[] = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content }));

        const result = await sendAgentMessage([...history, { role: 'user', content: userText }]);

        const response: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: result.response || 'Não obtive uma resposta do agente.',
          timestamp: new Date(),
          structuredData: deriveStructuredData(result.actions, result.response),
          followUpActions: ['Ver tarefas', 'Ver arquivos', 'Ver relatórios'],
        };

        setMessages((prev) => [...prev, response]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao consultar o agente.';
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content: `Desculpe, o agente não conseguiu processar sua solicitação: ${message}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, scrollToBottom]
  );

  /* Send message */
  const sendMessage = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    handleAgentResponse(trimmed, attachments);
  }, [inputValue, attachments, handleAgentResponse]);

  /* Keyboard handlers */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* Textarea auto-resize */
  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  /* File handling */
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: FileAttachment[] = Array.from(files).map((file) => ({
      id: generateId(),
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      progress: 0,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  /* Drag & Drop */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  /* Welcome chip click */
  const handleChipClick = (text: string) => {
    setInputValue(text);
    textareaRef.current?.focus();
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 56px - 48px)' }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* ========== MESSAGES AREA ========== */}
      <div
        className="flex-1 overflow-y-auto px-2 py-4 sm:px-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {!hasMessages ? (
          /* ---- WELCOME STATE ---- */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex h-full flex-col items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
              className="mb-6"
            >
              <img
                src="/empty-state-chat.svg"
                alt="Chat"
                className="mx-auto h-28 w-28 opacity-80"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(99,102,241,0.08)' }}
              >
                <Bot size={40} style={{ color: 'var(--primary)' }} />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
              className="mb-2 text-center text-[22px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Como posso ajudar hoje?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
              className="mb-8 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Arraste arquivos ou digite um comando para comecar
            </motion.p>

            {/* Chip Row 1 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mb-2 flex flex-wrap justify-center gap-2"
            >
              {WELCOME_CHIPS_ROW1.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.label)}
                  className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--primary-light)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <chip.icon size={14} />
                  {chip.label}
                </button>
              ))}
            </motion.div>

            {/* Chip Row 2 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {WELCOME_CHIPS_ROW2.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.label)}
                  className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--primary-light)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <chip.icon size={14} />
                  {chip.label}
                </button>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          /* ---- CHAT STATE ---- */
          <div className="mx-auto max-w-3xl">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{
                    opacity: 0,
                    x: msg.role === 'user' ? 16 : -16,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: [0, 0, 0.2, 1] as [number, number, number, number],
                    delay: 0.05 * Math.min(index, 5),
                  }}
                  className={`mb-5 flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        msg.role === 'assistant'
                          ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                          : 'var(--primary-dark)',
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <Bot size={18} className="text-white" />
                    ) : (
                      <User size={18} className="text-white" />
                    )}
                  </div>

                  {/* Bubble + content */}
                  <div
                    className={`flex max-w-[70%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {/* File attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2 flex flex-col gap-2">
                        {msg.attachments.map((att) => {
                          const Icon = getFileIcon(att.type);
                          return (
                            <motion.div
                              key={att.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center gap-3 rounded-lg border px-3 py-2"
                              style={{
                                backgroundColor: 'var(--surface-hover)',
                                borderColor: 'var(--border)',
                              }}
                            >
                              <Icon size={18} style={{ color: 'var(--primary)' }} />
                              <div className="min-w-0">
                                <p
                                  className="max-w-[200px] truncate text-xs font-medium"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  {att.name}
                                </p>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                  {att.size}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        backgroundColor:
                          msg.role === 'user' ? '#6366F1' : 'var(--surface)',
                        color: msg.role === 'user' ? 'white' : 'var(--text-secondary)',
                        border:
                          msg.role === 'user'
                            ? 'none'
                            : '1px solid var(--border)',
                        borderRadius:
                          msg.role === 'user'
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px',
                        lineHeight: 1.6,
                        fontSize: 14,
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Structured response */}
                    {msg.structuredData && (
                      <div className="w-full max-w-md">
                        <StructuredResponse data={msg.structuredData} />
                      </div>
                    )}

                    {/* Timestamp */}
                    <span
                      className="mt-1 text-[11px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatTime(msg.timestamp)}
                    </span>

                    {/* Follow-up actions */}
                    {msg.followUpActions && msg.followUpActions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.2 }}
                        className="mt-2 flex flex-wrap gap-1.5"
                      >
                        {msg.followUpActions.map((action, i) => (
                          <motion.button
                            key={action}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.06 }}
                            onClick={() => handleChipClick(action)}
                            className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                            style={{
                              borderColor: 'var(--border)',
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text-muted)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                              e.currentTarget.style.borderColor = 'var(--primary-light)';
                              e.currentTarget.style.color = 'var(--primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--surface)';
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                          >
                            {action}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 flex gap-3"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  }}
                >
                  <Bot size={18} className="text-white" />
                </div>
                <TypingIndicator />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ========== DRAG & DROP OVERLAY ========== */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(99,102,241,0.08)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12"
              style={{
                borderColor: 'var(--primary)',
                backgroundColor: 'rgba(255,255,255,0.9)',
              }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <UploadCloud size={64} style={{ color: 'var(--primary)' }} />
              </motion.div>
              <p
                className="mt-4 text-base font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                Solte os arquivos aqui
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Suporta PDF, Excel, Word, CSV, imagens, ZIP
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== ATTACHMENTS PREVIEW ========== */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-auto w-full max-w-3xl overflow-hidden px-2 sm:px-4"
          >
            <div className="flex flex-wrap gap-2 pb-2">
              {attachments.map((att) => {
                const Icon = getFileIcon(att.type);
                return (
                  <motion.div
                    key={att.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <Icon size={16} style={{ color: 'var(--primary)' }} />
                    <span
                      className="max-w-[150px] truncate text-xs font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {att.name}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {att.size}
                    </span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="ml-1 rounded-full p-0.5 transition-colors hover:bg-red-50"
                      aria-label="Remover arquivo"
                    >
                      <X size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== INPUT AREA ========== */}
      <div className="mx-auto w-full max-w-3xl px-2 pb-2 sm:px-4">
        <div
          className="flex items-end gap-2 rounded-2xl border p-3 shadow-lg transition-all duration-200 focus-within:ring-2"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          }}
          onFocus={(e) => {
            const target = e.currentTarget;
            target.style.borderColor = 'var(--primary)';
            target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15), 0 4px 20px rgba(0,0,0,0.06)';
          }}
          onBlur={(e) => {
            const target = e.currentTarget;
            target.style.borderColor = 'var(--border)';
            target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)';
          }}
        >
          {/* Paperclip button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Anexar arquivo"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.transform = 'rotate(45deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            <Paperclip size={20} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            rows={1}
            className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none"
            style={{
              color: 'var(--text-secondary)',
            }}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() && attachments.length === 0}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                inputValue.trim() || attachments.length > 0
                  ? 'var(--primary)'
                  : 'var(--border)',
            }}
            aria-label="Enviar mensagem"
            onMouseEnter={(e) => {
              if (inputValue.trim() || attachments.length > 0) {
                e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() || attachments.length > 0) {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Input helper text */}
        <p
          className="mt-1.5 text-center text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          Enter para enviar &middot; Shift+Enter para nova linha &middot; ESC para limpar
        </p>
      </div>
    </div>
  );
}

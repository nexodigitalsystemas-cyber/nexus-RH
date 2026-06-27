import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Users,
  Receipt,
  GitCompare,
  FileSignature,
  Wand2,
  FileBarChart,
  Table,
  FileText,
  Calendar,
  CheckCircle,
  Download,
  Trash2,
  Eye,
  Loader2,
  XCircle,
  Zap,
  MessageSquare,
  LayoutTemplate,
  X,
  Search,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

import type { Report } from '@/lib/api';
import { useReports } from '@/hooks/useReports';
import { formatFileSize } from '@/data/mockData';

interface Template {
  id: string;
  nome: string;
  descricao: string;
  icon: React.ElementType;
  cor: string;
  corBg: string;
  formato: 'excel' | 'pdf' | 'ambos';
}

interface EtapaProgresso {
  label: string;
  status: 'pendente' | 'ativo' | 'concluido';
}

/* ------------------------------------------------------------------ */
/*  Demo Data                                                          */
/* ------------------------------------------------------------------ */

const PLACEHOLDERS = [
  'Gere um relatorio de vendas do ultimo mes...',
  'Compare os orcamentos de fornecedores...',
  'Analise os curriculos recebidos...',
  'Resuma as notas fiscais por categoria...',
];

const TEMPLATES: Template[] = [
  {
    id: 'vendas',
    nome: 'Vendas Mensal',
    descricao: 'Resumo de vendas com graficos e metricas',
    icon: TrendingUp,
    cor: '#6366F1',
    corBg: 'rgba(99,102,241,0.1)',
    formato: 'excel',
  },
  {
    id: 'rh',
    nome: 'RH / Curriculos',
    descricao: 'Analise de candidatos e skills',
    icon: Users,
    cor: '#8B5CF6',
    corBg: 'rgba(139,92,246,0.1)',
    formato: 'excel',
  },
  {
    id: 'nfs',
    nome: 'Notas Fiscais',
    descricao: 'Resumo de NFs por categoria e periodo',
    icon: Receipt,
    cor: '#10B981',
    corBg: 'rgba(16,185,129,0.1)',
    formato: 'excel',
  },
  {
    id: 'conciliacao',
    nome: 'Conciliacao',
    descricao: 'Comparativo entre fontes de dados',
    icon: GitCompare,
    cor: '#F59E0B',
    corBg: 'rgba(245,158,11,0.1)',
    formato: 'pdf',
  },
  {
    id: 'contratos',
    nome: 'Contratos',
    descricao: 'Resumo de contratos e vencimentos',
    icon: FileSignature,
    cor: '#3B82F6',
    corBg: 'rgba(59,130,246,0.1)',
    formato: 'pdf',
  },
  {
    id: 'customizado',
    nome: 'Customizado',
    descricao: 'Relatorio personalizado por comando natural',
    icon: Wand2,
    cor: '#EC4899',
    corBg: 'rgba(236,72,153,0.1)',
    formato: 'ambos',
  },
];

const ETAPAS: EtapaProgresso[] = [
  { label: 'Analisando dados...', status: 'pendente' },
  { label: 'Processando informacoes...', status: 'pendente' },
  { label: 'Formatando relatorio...', status: 'pendente' },
];

/* ------------------------------------------------------------------ */
/*  Utility: Counter animation                                         */
/* ------------------------------------------------------------------ */

function useCounter(target: number, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Format Toggle (Excel / PDF) — pure HTML+Tailwind                   */
/* ------------------------------------------------------------------ */

function FormatToggle({
  value,
  onChange,
}: {
  value: 'excel' | 'pdf';
  onChange: (v: 'excel' | 'pdf') => void;
}) {
  return (
    <div
      className="relative inline-flex items-center rounded-lg p-1"
      style={{ backgroundColor: 'var(--border-light)' }}
    >
      <motion.div
        className="absolute h-7 rounded-md"
        style={{
          backgroundColor: value === 'excel' ? '#D1FAE5' : '#DBEAFE',
          width: '72px',
        }}
        animate={{ x: value === 'excel' ? 0 : 72 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <button
        onClick={() => onChange('excel')}
        className="relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          color: value === 'excel' ? '#10B981' : 'var(--text-muted)',
          minWidth: '72px',
          justifyContent: 'center',
        }}
      >
        <Table size={14} />
        Excel
      </button>
      <button
        onClick={() => onChange('pdf')}
        className="relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          color: value === 'pdf' ? '#3B82F6' : 'var(--text-muted)',
          minWidth: '72px',
          justifyContent: 'center',
        }}
      >
        <FileText size={14} />
        PDF
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Report['status'] }) {
  const config = {
    pronto: {
      bg: '#D1FAE5',
      color: '#10B981',
      icon: CheckCircle,
      label: 'Pronto',
    },
    gerando: {
      bg: '#DBEAFE',
      color: '#3B82F6',
      icon: Loader2,
      label: 'Gerando...',
    },
    erro: {
      bg: '#FEE2E2',
      color: '#EF4444',
      icon: XCircle,
      label: 'Erro',
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <Icon size={12} className={status === 'gerando' ? 'animate-spin' : ''} />
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Type Badge                                                         */
/* ------------------------------------------------------------------ */

function TypeBadge({ type }: { type: Report['type'] }) {
  const config = {
    excel: { bg: '#D1FAE5', color: '#10B981', label: 'Excel', icon: Table },
    pdf: { bg: '#FEE2E2', color: '#EF4444', label: 'PDF', icon: FileText },
  };
  const c = config[type];
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <Icon size={11} />
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Relatorios() {
  /* State */
  const [inputText, setInputText] = useState('');
  const [formato, setFormato] = useState<'excel' | 'pdf'>('excel');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [etapas, setEtapas] = useState<EtapaProgresso[]>(ETAPAS);
  const [geracaoCompleta, setGeracaoCompleta] = useState(false);
  const { reports: relatorios, loading: reportsLoading, addReport, remove } = useReports();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'excel' | 'pdf'>('todos');
  const [relatorioPreview, setRelatorioPreview] = useState<Report | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  /* Refs */
  const generationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Cycling placeholder */
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  /* Stats visibility for counter animation */
  useEffect(() => {
    const timer = setTimeout(() => setStatsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  /* Stat values with counter */
  const totalCounter = useCounter(47, 1200, statsVisible);
  const mesCounter = useCounter(12, 1200, statsVisible);
  const tempoCounter = useCounter(3, 1200, statsVisible);
  const favoritosCounter = useCounter(5, 1200, statsVisible);

  /* Filter reports */
  const relatoriosFiltrados = relatorios.filter((r) => {
    const matchBusca = r.name.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || r.type === filtroTipo;
    return matchBusca && matchTipo;
  });

  /* Simulate generation process */
  const simulateGeneration = useCallback(() => {
    setIsGenerating(true);
    setProgresso(0);
    setGeracaoCompleta(false);
    setEtapas([
      { label: 'Analisando dados...', status: 'ativo' },
      { label: 'Processando informacoes...', status: 'pendente' },
      { label: 'Formatando relatorio...', status: 'pendente' },
    ]);

    let progress = 0;
    generationTimer.current = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress > 100) progress = 100;
      setProgresso(Math.round(progress));

      if (progress <= 30) {
        setEtapas([
          { label: 'Analisando dados...', status: 'ativo' },
          { label: 'Processando informacoes...', status: 'pendente' },
          { label: 'Formatando relatorio...', status: 'pendente' },
        ]);
      } else if (progress <= 70) {
        setEtapas([
          { label: 'Analisando dados...', status: 'concluido' },
          { label: 'Processando informacoes...', status: 'ativo' },
          { label: 'Formatando relatorio...', status: 'pendente' },
        ]);
      } else {
        setEtapas([
          { label: 'Analisando dados...', status: 'concluido' },
          { label: 'Processando informacoes...', status: 'concluido' },
          { label: 'Formatando relatorio...', status: 'ativo' },
        ]);
      }

      if (progress >= 100) {
        if (generationTimer.current) clearInterval(generationTimer.current);
        setEtapas([
          { label: 'Analisando dados...', status: 'concluido' },
          { label: 'Processando informacoes...', status: 'concluido' },
          { label: 'Formatando relatorio...', status: 'concluido' },
        ]);
        setTimeout(() => {
          setIsGenerating(false);
          setGeracaoCompleta(true);
          const novoRelatorio: Omit<Report, 'id' | 'created_at'> = {
            name:
              formato === 'excel'
                ? `Relatorio_Gerado_${format(new Date(), 'dd-MM-yyyy', { locale: ptBR })}.xlsx`
                : `Relatorio_Gerado_${format(new Date(), 'dd-MM-yyyy', { locale: ptBR })}.pdf`,
            type: formato,
            status: 'pronto',
            description: inputText || 'Relatorio gerado via comando natural',
            file_path: `/reports/Relatorio_Gerado_${format(new Date(), 'dd-MM-yyyy', { locale: ptBR })}.${formato}`,
            file_size: formato === 'excel' ? 159744 : 100352,
          };
          addReport(novoRelatorio);
        }, 500);
      }
    }, 200);
  }, [formato, inputText]);

  /* Generate from input */
  const handleGenerate = () => {
    if (!inputText.trim()) return;
    simulateGeneration();
  };

  /* Generate from template */
  const handleUseTemplate = (template: Template) => {
    const textMap: Record<string, string> = {
      vendas: 'Gere um relatorio de vendas do ultimo mes com graficos e metricas',
      rh: 'Analise os curriculos processados com skills e experiencias',
      nfs: 'Resuma as notas fiscais do mes por categoria e periodo',
      conciliacao: 'Faca uma conciliacao entre extratos bancarios e vendas',
      contratos: 'Gere um resumo dos contratos e datas de vencimento',
      customizado: 'Crie um relatorio personalizado com os parametros avancados',
    };
    setInputText(textMap[template.id] || '');
    if (template.formato === 'excel' || template.formato === 'pdf') {
      setFormato(template.formato);
    }
    simulateGeneration();
  };

  /* Delete report */
  const handleDelete = async (id: number) => {
    await remove(id);
  };

  /* Format date */
  const formatarData = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  /* Cleanup timer */
  useEffect(() => {
    return () => {
      if (generationTimer.current) clearInterval(generationTimer.current);
    };
  }, []);

  /* Animation variants */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
    },
  };

  return (
    <div className="space-y-6 pb-8">
      {reportsLoading && (
        <div className="rounded-lg border px-4 py-2 text-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          Carregando relatórios...
        </div>
      )}

      {/* ============ HEADER ============ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Relatorios
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Gere relatorios e analises automaticamente
        </p>
      </motion.div>

      {/* ============ GENERATOR + TEMPLATES ============ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* --- Natural Language Generator --- */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div
            className="rounded-2xl border bg-white p-6 shadow-card"
            style={{ borderLeft: '4px solid var(--primary)' }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
              >
                <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Relatorio por Comando
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Descreva o relatorio que voce precisa em linguagem natural
                </p>
              </div>
            </div>

            {/* Input area */}
            <div className="relative">
              <div className="absolute left-4 top-4">
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={PLACEHOLDERS[placeholderIdx]}
                className="min-h-[120px] w-full resize-y rounded-xl border p-4 pl-12 text-sm outline-none transition-all"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Command chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Vendas do ultimo mes',
                'Curriculos processados',
                'NFs por categoria',
                'Comparativo de orcamentos',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setInputText((prev) => (prev ? prev + ' ' : '') + chip.toLowerCase())}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--border-light)',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-light)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Controls row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <FormatToggle value={formato} onChange={setFormato} />
              <motion.button
                onClick={handleGenerate}
                disabled={!inputText.trim() || isGenerating}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--primary)',
                  boxShadow: '0 1px 2px rgba(99,102,241,0.3)',
                }}
                whileHover={inputText.trim() && !isGenerating ? { scale: 1.02 } : {}}
                whileTap={inputText.trim() && !isGenerating ? { scale: 0.98 } : {}}
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar Relatorio'}
              </motion.button>
            </div>
          </div>

          {/* Processing Card */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 overflow-hidden"
              >
                <div
                  className="rounded-xl p-5"
                  style={{
                    border: '1px solid var(--primary-light)',
                    backgroundColor: 'rgba(99,102,241,0.03)',
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                      <Zap size={16} />
                      Gerando Relatorio...
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                      {Math.round(progresso)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--border-light)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progresso}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {etapas.map((etapa, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {etapa.status === 'concluido' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                          >
                            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                          </motion.div>
                        )}
                        {etapa.status === 'ativo' && (
                          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--info)' }} />
                        )}
                        {etapa.status === 'pendente' && (
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ border: '2px solid var(--border)' }}
                          />
                        )}
                        <span
                          className="text-xs"
                          style={{
                            color:
                              etapa.status === 'concluido'
                                ? 'var(--success)'
                                : etapa.status === 'ativo'
                                  ? 'var(--info)'
                                  : 'var(--text-muted)',
                            fontWeight: etapa.status === 'ativo' ? 600 : 400,
                          }}
                        >
                          {etapa.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion message */}
          <AnimatePresence>
            {geracaoCompleta && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center justify-between rounded-xl border p-4"
                style={{ borderColor: 'var(--success)', backgroundColor: 'var(--success-light)' }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                      Relatorio pronto!
                    </p>
                    <p className="text-xs" style={{ color: 'var(--success)', opacity: 0.8 }}>
                      Seu relatorio foi gerado com sucesso
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGeracaoCompleta(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{
                      border: '1px solid var(--success)',
                      color: 'var(--success)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Fechar
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: 'var(--success)' }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* --- Templates Grid --- */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="rounded-2xl border bg-white p-6 shadow-card">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
              >
                <LayoutTemplate size={20} style={{ color: 'var(--secondary)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Templates
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Relatorios pre-configurados
                </p>
              </div>
            </div>

            {/* Grid */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <motion.button
                    key={template.id}
                    variants={cardVariants}
                    onClick={() => handleUseTemplate(template)}
                    className="flex flex-col items-start rounded-xl border p-4 text-left transition-all"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--surface)',
                    }}
                    whileHover={{
                      y: -2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div
                      className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg"
                      style={{ backgroundColor: template.corBg }}
                    >
                      <Icon size={24} style={{ color: template.cor }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {template.nome}
                    </span>
                    <span className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {template.descricao}
                    </span>
                    <span
                      className="mt-2 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor:
                          template.formato === 'excel'
                            ? '#D1FAE5'
                            : template.formato === 'pdf'
                              ? '#DBEAFE'
                              : 'var(--border-light)',
                        color:
                          template.formato === 'excel'
                            ? '#10B981'
                            : template.formato === 'pdf'
                              ? '#3B82F6'
                              : 'var(--text-muted)',
                      }}
                    >
                      {template.formato === 'ambos' ? 'Excel/PDF' : template.formato.toUpperCase()}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ============ STATISTICS BAR ============ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
          borderColor: 'var(--border)',
        }}
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            {
              label: 'Total de Relatorios',
              value: totalCounter,
              icon: FileBarChart,
              cor: '#6366F1',
              corBg: 'rgba(99,102,241,0.1)',
            },
            {
              label: 'Este Mes',
              value: mesCounter,
              icon: Calendar,
              cor: '#F59E0B',
              corBg: 'rgba(245,158,11,0.1)',
            },
            {
              label: 'Tempo Medio (min)',
              value: tempoCounter,
              icon: CheckCircle,
              cor: '#10B981',
              corBg: 'rgba(16,185,129,0.1)',
              decimal: true,
            },
            {
              label: 'Favoritos',
              value: favoritosCounter,
              icon: Sparkles,
              cor: '#8B5CF6',
              corBg: 'rgba(139,92,246,0.1)',
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: stat.corBg }}
                >
                  <Icon size={18} style={{ color: stat.cor }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stat.decimal ? `${stat.value}.2` : stat.value}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ============ RECENT REPORTS TABLE ============ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="overflow-hidden rounded-xl border bg-white shadow-card"
      >
        {/* Table Header Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Relatorios Recentes
            </h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--border-light)', color: 'var(--text-muted)' }}
            >
              {relatorios.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-8 w-44 rounded-lg border pl-8 pr-3 text-xs outline-none transition-all"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            {/* Type filter */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'excel' | 'pdf')}
              className="h-8 rounded-lg border px-2 text-xs outline-none"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <option value="todos">Todos</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--border-light)' }}>
                {['Nome', 'Tipo', 'Formato', 'Data', 'Status', 'Acoes'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {relatoriosFiltrados.map((relatorio) => (
                  <motion.tr
                    key={relatorio.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span
                          className="max-w-[240px] truncate text-sm font-medium"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {relatorio.name}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {relatorio.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={relatorio.type} />
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {relatorio.file_size ? formatFileSize(relatorio.file_size) : '--'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatarData(relatorio.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={relatorio.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {relatorio.status === 'pronto' && (
                          <>
                            <button
                              onClick={() => setRelatorioPreview(relatorio)}
                              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                                e.currentTarget.style.color = 'var(--primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                              aria-label="Visualizar relatorio"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                                e.currentTarget.style.color = 'var(--primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                              aria-label="Download relatorio"
                            >
                              <Download size={15} />
                            </button>
                          </>
                        )}
                        {relatorio.status === 'erro' && (
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                              e.currentTarget.style.color = 'var(--warning)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                            aria-label="Tentar novamente"
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}
                        {relatorio.status === 'gerando' && (
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                              e.currentTarget.style.color = 'var(--danger)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                            aria-label="Cancelar geracao"
                          >
                            <X size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(relatorio.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                            e.currentTarget.style.color = 'var(--danger)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }}
                          aria-label="Excluir relatorio"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {relatoriosFiltrados.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <FileBarChart size={48} style={{ color: 'var(--border)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Nenhum relatorio encontrado
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Tente ajustar os filtros ou gere um novo relatorio
            </p>
          </div>
        )}
      </motion.div>

      {/* ============ REPORT PREVIEW MODAL ============ */}
      <AnimatePresence>
        {relatorioPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setRelatorioPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between p-5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {relatorioPreview.name}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {relatorioPreview.description}
                  </p>
                </div>
                <button
                  onClick={() => setRelatorioPreview(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Fechar modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body - Mock Preview */}
              <div className="max-h-[60vh] overflow-auto p-5">
                {/* Mock Excel Preview */}
                {relatorioPreview.type === 'excel' ? (
                  <div>
                    {/* Sheet tabs */}
                    <div className="mb-3 flex gap-1">
                      {['Resumo', 'Detalhes', 'Graficos'].map((tab, i) => (
                        <button
                          key={tab}
                          className="rounded-t-lg px-4 py-2 text-xs font-medium"
                          style={{
                            backgroundColor: i === 0 ? 'white' : 'var(--border-light)',
                            color: i === 0 ? 'var(--primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderBottom: i === 0 ? 'none' : undefined,
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {/* Mock table */}
                    <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>
                            {['Item', 'Descricao', 'Qtd', 'Valor', 'Total'].map((h) => (
                              <th
                                key={h}
                                className="border-r px-3 py-2 text-left font-semibold last:border-r-0"
                                style={{
                                                                  borderColor: 'var(--border)',
                                                                  color: 'var(--text-secondary)',
                                                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['001', 'Servico de consultoria', '10h', 'R$ 150,00', 'R$ 1.500,00'],
                            ['002', 'Licenca de software', '5', 'R$ 299,00', 'R$ 1.495,00'],
                            ['003', 'Suporte tecnico', '20h', 'R$ 80,00', 'R$ 1.600,00'],
                            ['004', 'Treinamento', '8', 'R$ 450,00', 'R$ 3.600,00'],
                            ['005', 'Implementacao', '1', 'R$ 5.000,00', 'R$ 5.000,00'],
                          ].map((row, i) => (
                            <tr
                              key={i}
                              style={{
                                backgroundColor: i % 2 === 0 ? 'white' : 'var(--border-light)',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              {row.map((cell, j) => (
                                <td
                                  key={j}
                                  className="border-r px-3 py-2 last:border-r-0"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr style={{ backgroundColor: 'rgba(99,102,241,0.05)', fontWeight: 600 }}>
                            <td colSpan={4} className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                              Total Geral:
                            </td>
                            <td className="px-3 py-2" style={{ color: 'var(--primary)' }}>
                              R$ 13.195,00
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Mock PDF Preview */
                  <div
                    className="rounded-lg border p-8"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: '#FAFAFA',
                      aspectRatio: '210/297',
                      maxHeight: '500px',
                    }}
                  >
                    <div className="mb-6 text-center">
                      <h4 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {relatorioPreview.name.replace('.pdf', '')}
                      </h4>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        Gerado em {formatarData(relatorioPreview.created_at)}
                      </p>
                    </div>
                    <div
                      className="mb-4 h-2 w-full rounded-full"
                      style={{ backgroundColor: 'var(--border-light)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: '75%', backgroundColor: 'var(--primary)' }}
                      />
                    </div>
                    <p className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>Indicador de desempenho: 75%</p>
                    <div className="mt-6 space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-3 rounded"
                          style={{
                            backgroundColor: 'var(--border-light)',
                            width: `${60 + i * 10}%`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-8 grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-20 rounded-lg"
                          style={{ backgroundColor: 'var(--border-light)' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                className="flex items-center justify-end gap-2 p-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => setRelatorioPreview(null)}
                  className="rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Fechar
                </button>
                <button
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <Download size={14} />
                  Download {relatorioPreview.type === 'excel' ? 'Excel' : 'PDF'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

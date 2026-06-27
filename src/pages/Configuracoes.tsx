import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Palette,
  Globe,
  Bell,
  FolderOpen,
  Cpu,
  Save,
  RotateCcw,
  RefreshCw,
  Check,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  Monitor,
  FolderInput,
  HardDrive,
  Database,
  Box,
  Loader2,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAIStatus, getAIConfig } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConfigState {
  modelo: string;
  ollamaUrl: string;
  temperatura: number;
  maxTokens: number;
  tema: 'claro' | 'escuro' | 'sistema';
  corDestaque: string;
  tamanhoFonte: number;
  idioma: string;
  formatoData: string;
  moeda: string;
  fusoHorario: string;
  notifNavegador: boolean;
  notifSom: boolean;
  notifTarefa: boolean;
  notifRelatorio: boolean;
  notifErro: boolean;
  pastaDocumentos: string;
  pastaCurriculos: string;
  pastaRelatorios: string;
  pastaTemp: string;
}

interface ModeloInfo {
  nome: string;
  params: string;
  descricao: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MODELOS: ModeloInfo[] = [
  { nome: 'phi3:mini', params: '3.8B', descricao: 'Rapido e eficiente' },
  { nome: 'tinyllama', params: '1.1B', descricao: 'Ultra-leve para tarefas simples' },
  { nome: 'llama3.2', params: '3.2B', descricao: 'Equilibrio entre velocidade e qualidade' },
  { nome: 'llama3.1', params: '8B', descricao: 'Modelo robusto para tarefas complexas' },
  { nome: 'mistral', params: '7B', descricao: 'Alta performance para diversas tarefas' },
  { nome: 'codellama', params: '7B', descricao: 'Especializado em codigo' },
  { nome: 'neural-chat', params: '7B', descricao: 'Otimizado para conversacao' },
];

const CORES_DESTAQUE = [
  { nome: 'Indigo', hex: '#6366F1' },
  { nome: 'Violeta', hex: '#8B5CF6' },
  { nome: 'Azul', hex: '#3B82F6' },
  { nome: 'Verde', hex: '#10B981' },
  { nome: 'Laranja', hex: '#F59E0B' },
  { nome: 'Rosa', hex: '#EC4899' },
];

const NAV_ITEMS = [
  { id: 'ia', label: 'IA e Modelo', icon: Brain, color: '#6366F1' },
  { id: 'aparencia', label: 'Aparência', icon: Palette, color: '#8B5CF6' },
  { id: 'idioma', label: 'Idioma e Regional', icon: Globe, color: '#3B82F6' },
  { id: 'notificacoes', label: 'Notificações', icon: Bell, color: '#F59E0B' },
  { id: 'pastas', label: 'Pastas e Arquivos', icon: FolderOpen, color: '#10B981' },
  { id: 'sistema', label: 'Sistema e Avançado', icon: Cpu, color: '#64748B' },
];

const DEFAULTS: ConfigState = {
  modelo: 'llama3.2:3b',
  ollamaUrl: 'http://localhost:11434',
  temperatura: 0.7,
  maxTokens: 2048,
  tema: 'claro',
  corDestaque: '#6366F1',
  tamanhoFonte: 14,
  idioma: 'pt-BR',
  formatoData: 'DD/MM/YYYY',
  moeda: 'BRL',
  fusoHorario: 'America/Sao_Paulo',
  notifNavegador: true,
  notifSom: true,
  notifTarefa: true,
  notifRelatorio: true,
  notifErro: true,
  pastaDocumentos: '~/nexus/documentos',
  pastaCurriculos: '~/nexus/documentos/curriculos',
  pastaRelatorios: '~/nexus/documentos/relatorios',
  pastaTemp: '~/nexus/temp',
};

/* ------------------------------------------------------------------ */
/*  Toggle Switch (pure HTML+Tailwind, NO shadcn)                      */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? 'var(--primary)' : 'var(--border)' }}
      aria-label={ariaLabel}
      role="switch"
      aria-checked={checked}
    >
      <motion.div
        className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Configuracoes() {
  /* State */
  const [config, setConfig] = useState<ConfigState>(() => {
    try {
      const stored = localStorage.getItem('nexus-config');
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  const [activeSection, setActiveSection] = useState('ia');
  const [conexaoStatus, setConexaoStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [conexaoErro, setConexaoErro] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);
  const [horaPreview, setHoraPreview] = useState(new Date());

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* Update preview time */
  useEffect(() => {
    const timer = setInterval(() => setHoraPreview(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* Persist to localStorage */
  useEffect(() => {
    localStorage.setItem('nexus-config', JSON.stringify(config));
  }, [config]);

  /* ScrollSpy: track active section */
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const el = sectionRefs.current[NAV_ITEMS[i].id];
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(NAV_ITEMS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Helper: update config field */
  const update = useCallback(<K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* Load AI config from backend on mount */
  useEffect(() => {
    getAIConfig()
      .then((cfg) => {
        setConfig((prev) => ({
          ...prev,
          modelo: cfg.model,
          ollamaUrl: cfg.baseUrl,
          temperatura: cfg.temperature,
          maxTokens: cfg.maxTokens,
        }));
      })
      .catch(() => {
        // keep defaults / localStorage values
      });
  }, []);

  /* Test Ollama connection via backend */
  const testarConexao = async () => {
    setConexaoStatus('testing');
    setConexaoErro('');
    try {
      const status = await getAIStatus(config.ollamaUrl);
      if (status.ok && !status.error) {
        setConexaoStatus('success');
      } else {
        setConexaoStatus('error');
        setConexaoErro(status.error || 'Erro desconhecido');
      }
    } catch (err) {
      setConexaoStatus('error');
      setConexaoErro(err instanceof Error ? err.message : 'Erro de rede');
    }
  };

  /* Save settings */
  const salvarConfig = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSalvoSucesso(true);
      setTimeout(() => setSalvoSucesso(false), 3000);
    }, 1500);
  };

  /* Reset to defaults */
  const restaurarPadroes = () => {
    if (window.confirm('Tem certeza? Todas as configuracoes serao restauradas.')) {
      setConfig(DEFAULTS);
    }
  };

  /* Scroll to section */
  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* Format preview date/time */
  const formatPreview = () => {
    try {
      const opts: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: config.fusoHorario,
      };
      return new Intl.DateTimeFormat(config.idioma === 'pt-BR' ? 'pt-BR' : config.idioma === 'es' ? 'es-ES' : 'en-US', opts).format(horaPreview);
    } catch {
      return format(horaPreview, 'dd/MM/yyyy HH:mm:ss');
    }
  };

  /* Currency preview */
  const currencyPreview = () => {
    const symbols: Record<string, string> = { BRL: 'R$', USD: '$', EUR: '€' };
    return `${symbols[config.moeda] || 'R$'} 1.234,56`;
  };

  /* Card border-left colors per section */
  const cardBorderColors: Record<string, string> = {
    ia: 'var(--primary)',
    aparencia: 'var(--secondary)',
    idioma: 'var(--info)',
    notificacoes: 'var(--warning)',
    pastas: 'var(--success)',
    sistema: 'var(--text-muted)',
  };

  /* Section header colors per section */
  const sectionIconColors: Record<string, string> = {
    ia: 'var(--primary)',
    aparencia: 'var(--secondary)',
    idioma: 'var(--info)',
    notificacoes: 'var(--warning)',
    pastas: 'var(--success)',
    sistema: 'var(--text-muted)',
  };

  /* Section icon backgrounds */
  const sectionIconBgs: Record<string, string> = {
    ia: 'rgba(99,102,241,0.1)',
    aparencia: 'rgba(139,92,246,0.1)',
    idioma: 'rgba(59,130,246,0.1)',
    notificacoes: 'rgba(245,158,11,0.1)',
    pastas: 'rgba(16,185,129,0.1)',
    sistema: 'rgba(100,116,139,0.1)',
  };

  return (
    <div className="pb-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Configuracoes
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Personalize seu funcionario de IA
        </p>
      </motion.div>

      {/* Main Layout: Nav + Content */}
      <div className="flex gap-8">
        {/* ----- Left Navigation ----- */}
        <motion.nav
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="sticky top-20 hidden h-fit w-[200px] shrink-0 rounded-xl border p-3 lg:block"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className="relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
                    style={{
                      color: isActive ? item.color : 'var(--text-secondary)',
                      backgroundColor: isActive ? `${item.color}15` : 'transparent',
                      borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? item.color : 'var(--text-muted)' }} />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.nav>

        {/* ----- Right Content ----- */}
        <div className="min-w-0 flex-1 space-y-8">
          {/* ============================================= */}
          {/* SECTION 1: IA e Modelo                         */}
          {/* ============================================= */}
          <motion.section
            ref={(el) => { sectionRefs.current['ia'] = el; }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-xl border bg-white p-7 shadow-card"
            style={{ borderLeft: `4px solid ${cardBorderColors.ia}` }}
          >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: sectionIconBgs.ia }}
              >
                <Brain size={22} style={{ color: sectionIconColors.ia }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Configuracoes da IA
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Configure o modelo Ollama e parametros de geracao
                </p>
              </div>
            </div>

            {/* Fields: 2-column grid */}
            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Modelo */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Modelo Ollama <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={config.modelo}
                  onChange={(e) => update('modelo', e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {MODELOS.map((m) => (
                    <option key={m.nome} value={m.nome}>
                      {m.nome}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  O modelo que processara seus comandos
                </p>
              </div>

              {/* URL */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  URL do Ollama
                </label>
                <input
                  type="text"
                  value={config.ollamaUrl}
                  onChange={(e) => update('ollamaUrl', e.target.value)}
                  placeholder="http://localhost:11434"
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Endereco do servidor Ollama local
                </p>
              </div>

              {/* Temperatura */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Temperatura
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    value={config.temperatura}
                    onChange={(e) => update('temperatura', parseFloat(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--primary) ${(config.temperatura / 1.0) * 100}%, var(--border-light) ${(config.temperatura / 1.0) * 100}%)`,
                    }}
                  />
                  <span
                    className="min-w-[48px] rounded-lg border px-2 py-1 text-center text-sm font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
                  >
                    {config.temperatura.toFixed(1)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Factual</span>
                  <span>Criativo</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Tokens Maximos
                </label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => update('maxTokens', parseInt(e.target.value) || 2048)}
                  min={256}
                  max={8192}
                  step={256}
                  className="h-10 w-full rounded-lg border px-3 text-sm font-mono outline-none transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Limite de tokens por resposta
                </p>
              </div>
            </div>

            {/* Test Connection */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={testarConexao}
                disabled={conexaoStatus === 'testing'}
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
              >
                {conexaoStatus === 'testing' ? (
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--info)' }} />
                ) : conexaoStatus === 'success' ? (
                  <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                ) : conexaoStatus === 'error' ? (
                  <XCircle size={16} style={{ color: 'var(--danger)' }} />
                ) : (
                  <RefreshCw size={16} style={{ color: 'var(--text-muted)' }} />
                )}
                {conexaoStatus === 'testing'
                  ? 'Testando...'
                  : conexaoStatus === 'success'
                    ? 'Conectado!'
                    : conexaoStatus === 'error'
                      ? 'Erro na conexao'
                      : 'Testar Conexao'}
              </button>
              <AnimatePresence mode="wait">
                {conexaoStatus === 'success' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: 'var(--success)' }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                    Modelo: {config.modelo}
                  </motion.span>
                )}
                {conexaoStatus === 'error' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="max-w-md text-sm"
                    style={{ color: 'var(--danger)' }}
                    title={conexaoErro}
                  >
                    {conexaoErro || 'Nao foi possivel conectar ao Ollama'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Model Cards Grid */}
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Modelos Disponiveis no Sistema
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {MODELOS.map((modelo) => {
                const isActive = config.modelo === modelo.nome;
                return (
                  <motion.button
                    key={modelo.nome}
                    onClick={() => update('modelo', modelo.nome)}
                    className="rounded-xl border p-4 text-left transition-all"
                    style={{
                      borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: isActive ? 'rgba(99,102,241,0.03)' : 'var(--surface)',
                      borderWidth: isActive ? '2px' : '1px',
                    }}
                    whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {modelo.nome}
                    </p>
                    <div
                      className="my-2 h-px w-full"
                      style={{ backgroundColor: 'var(--border)' }}
                    />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {modelo.params} parametros
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {modelo.descricao}
                    </p>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex items-center gap-1 text-xs font-medium"
                        style={{ color: 'var(--success)' }}
                      >
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                        Ativo
                      </motion.p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          {/* ============================================= */}
          {/* SECTION 2: Aparência                           */}
          {/* ============================================= */}
          <motion.section
            ref={(el) => { sectionRefs.current['aparencia'] = el; }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border bg-white p-7 shadow-card"
            style={{ borderLeft: `4px solid ${cardBorderColors.aparencia}` }}
          >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: sectionIconBgs.aparencia }}
              >
                <Palette size={22} style={{ color: sectionIconColors.aparencia }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Aparência
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Personalize o visual do NEXUS AI
                </p>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Tema
              </label>
              <div
                className="inline-flex items-center gap-1 rounded-xl p-1"
                style={{ backgroundColor: 'var(--border-light)' }}
              >
                {[
                  { value: 'claro' as const, label: 'Claro', icon: Sun, iconColor: '#F59E0B' },
                  { value: 'escuro' as const, label: 'Escuro', icon: Moon, iconColor: '#6366F1' },
                  { value: 'sistema' as const, label: 'Sistema', icon: Monitor, iconColor: '#3B82F6' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isActive = config.tema === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => update('tema', opt.value)}
                      className="relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        color: isActive ? opt.iconColor : 'var(--text-muted)',
                        backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon size={16} style={{ color: isActive ? opt.iconColor : 'var(--text-muted)' }} />
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Theme Preview */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Pré-visualizacao
              </label>
              <div
                className="h-40 w-full max-w-xs overflow-hidden rounded-xl border"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: config.tema === 'escuro' ? '#0F172A' : '#F8FAFC',
                }}
              >
                <div className="p-4">
                  <div
                    className="mb-3 h-8 rounded-lg"
                    style={{
                      backgroundColor: config.tema === 'escuro' ? '#1E293B' : '#FFFFFF',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <div
                        className="h-4 w-16 rounded"
                        style={{ backgroundColor: 'var(--border-light)' }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="h-6 rounded-md px-2 py-1 text-xs text-white"
                      style={{ backgroundColor: config.corDestaque }}
                    >
                      Botao
                    </div>
                    <div
                      className="h-6 rounded-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--border-light)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Badge
                    </div>
                  </div>
                  <div
                    className="mt-3 h-2 w-full rounded-full"
                    style={{ backgroundColor: 'var(--border-light)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: '60%', backgroundColor: config.corDestaque }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Accent Color */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Cor de Destaque
              </label>
              <div className="flex flex-wrap gap-3">
                {CORES_DESTAQUE.map((cor) => {
                  const isActive = config.corDestaque === cor.hex;
                  return (
                    <motion.button
                      key={cor.hex}
                      onClick={() => update('corDestaque', cor.hex)}
                      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all"
                      style={{
                        backgroundColor: cor.hex,
                        border: isActive ? '3px solid var(--text-primary)' : '2px solid transparent',
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title={cor.nome}
                    >
                      {isActive && <Check size={16} className="text-white" strokeWidth={3} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Tamanho da Fonte: {config.tamanhoFonte}px
              </label>
              <input
                type="range"
                min={12}
                max={18}
                step={1}
                value={config.tamanhoFonte}
                onChange={(e) => update('tamanhoFonte', parseInt(e.target.value))}
                className="h-2 w-full max-w-xs cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, var(--primary) ${((config.tamanhoFonte - 12) / 6) * 100}%, var(--border-light) ${((config.tamanhoFonte - 12) / 6) * 100}%)`,
                }}
              />
              <div className="mt-1 flex w-full max-w-xs justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>12px</span>
                <span>15px</span>
                <span>18px</span>
              </div>
            </div>
          </motion.section>

          {/* ============================================= */}
          {/* SECTION 3: Idioma e Regional                   */}
          {/* ============================================= */}
          <motion.section
            ref={(el) => { sectionRefs.current['idioma'] = el; }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border bg-white p-7 shadow-card"
            style={{ borderLeft: `4px solid ${cardBorderColors.idioma}` }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: sectionIconBgs.idioma }}
              >
                <Globe size={22} style={{ color: sectionIconColors.idioma }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Idioma e Regional
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Configure idioma, formato de data e moeda
                </p>
              </div>
            </div>

            <div className="grid max-w-2xl grid-cols-1 gap-5 md:grid-cols-2">
              {/* Idioma */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Idioma
                </label>
                <select
                  value={config.idioma}
                  onChange={(e) => update('idioma', e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="es">Espanol</option>
                  <option value="en">English</option>
                </select>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Idioma da interface
                </p>
              </div>

              {/* Formato Data */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Formato de Data
                </label>
                <select
                  value={config.formatoData}
                  onChange={(e) => update('formatoData', e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              {/* Moeda */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Moeda
                </label>
                <select
                  value={config.moeda}
                  onChange={(e) => update('moeda', e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <option value="BRL">R$ Real</option>
                  <option value="USD">$ Dolar</option>
                  <option value="EUR">€ Euro</option>
                </select>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Exemplo: {currencyPreview()}
                </p>
              </div>

              {/* Fuso Horario */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Fuso Horario
                </label>
                <select
                  value={config.fusoHorario}
                  onChange={(e) => update('fusoHorario', e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </div>

            {/* Live Preview */}
            <div
              className="mt-5 rounded-xl border p-4"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--border-light)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Preview: Data e hora atual no formato configurado
              </p>
              <p className="mt-1 text-lg font-mono" style={{ color: 'var(--text-primary)' }}>
                {formatPreview()}
              </p>
            </div>
          </motion.section>

          {/* ============================================= */}
          {/* SECTION 4: Notificações                        */}
          {/* ============================================= */}
          <motion.section
            ref={(el) => { sectionRefs.current['notificacoes'] = el; }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border bg-white p-7 shadow-card"
            style={{ borderLeft: `4px solid ${cardBorderColors.notificacoes}` }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: sectionIconBgs.notificacoes }}
              >
                <Bell size={22} style={{ color: sectionIconColors.notificacoes }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Notificacoes
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Escolha quando ser notificado
                </p>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {[
                {
                  key: 'notifNavegador' as keyof ConfigState,
                  title: 'Notificacoes no navegador',
                  desc: 'Receber notificacoes do sistema no navegador',
                  icon: Bell,
                  iconColor: '#6366F1',
                },
                {
                  key: 'notifSom' as keyof ConfigState,
                  title: 'Som de alerta',
                  desc: 'Tocar som ao receber notificacao',
                  icon: VolumeIcon,
                  iconColor: '#8B5CF6',
                },
                {
                  key: 'notifTarefa' as keyof ConfigState,
                  title: 'Notificar ao concluir tarefa',
                  desc: 'Receber notificacao quando uma tarefa for concluida',
                  icon: CheckCircle,
                  iconColor: '#10B981',
                },
                {
                  key: 'notifRelatorio' as keyof ConfigState,
                  title: 'Notificar ao gerar relatorio',
                  desc: 'Notificar quando um relatorio estiver pronto',
                  icon: FileBarChartIcon,
                  iconColor: '#3B82F6',
                },
                {
                  key: 'notifErro' as keyof ConfigState,
                  title: 'Alertas de erro do sistema',
                  desc: 'Alertar quando ocorrer um erro na IA ou processamento',
                  icon: AlertTriangle,
                  iconColor: '#EF4444',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                const isOn = config[item.key] as boolean;
                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${item.iconColor}15` }}
                      >
                        <Icon size={16} style={{ color: item.iconColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {item.title}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={isOn}
                      onChange={(v) => update(item.key, v as never)}
                      ariaLabel={item.title}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ============================================= */}
          {/* SECTION 5: Pastas de Documentos                */}
          {/* ============================================= */}
          <motion.section
            ref={(el) => { sectionRefs.current['pastas'] = el; }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border bg-white p-7 shadow-card"
            style={{ borderLeft: `4px solid ${cardBorderColors.pastas}` }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: sectionIconBgs.pastas }}
              >
                <FolderOpen size={22} style={{ color: sectionIconColors.pastas }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Gerenciamento de Pastas
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Configure diretorios de trabalho do sistema
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { key: 'pastaDocumentos' as keyof ConfigState, label: 'Pasta de Documentos', default: '~/nexus/documentos', desc: 'Pasta onde os documentos processados sao armazenados' },
                { key: 'pastaCurriculos' as keyof ConfigState, label: 'Pasta de Curriculos', default: '~/nexus/documentos/curriculos', desc: 'Pasta para curriculos e candidatos' },
                { key: 'pastaRelatorios' as keyof ConfigState, label: 'Pasta de Relatorios', default: '~/nexus/documentos/relatorios', desc: 'Pasta onde os relatorios gerados sao salvos' },
                { key: 'pastaTemp' as keyof ConfigState, label: 'Pasta Temporaria', default: '~/nexus/temp', desc: 'Arquivos temporarios do sistema' },
              ].map((pasta) => (
                <div key={pasta.key}>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {pasta.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config[pasta.key] as string}
                      onChange={(e) => update(pasta.key, e.target.value)}
                      className="h-10 flex-1 rounded-lg border px-3 font-mono text-sm outline-none"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--surface)',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.webkitdirectory = true;
                        input.onchange = () => {};
                        input.click();
                      }}
                      className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--surface)',
                      }}
                      title="Selecionar pasta"
                    >
                      <FolderInput size={16} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {pasta.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={restaurarPadroes}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                Restaurar Padroes
              </button>
            </div>
          </motion.section>

          {/* ============================================= */}
          {/* SECTION 6: Sistema                             */}
          {/* ============================================= */}
          <motion.section
            ref={(el) => { sectionRefs.current['sistema'] = el; }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border bg-white p-7 shadow-card"
            style={{ borderLeft: `4px solid ${cardBorderColors.sistema}` }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: sectionIconBgs.sistema }}
              >
                <Cpu size={22} style={{ color: sectionIconColors.sistema }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Sistema
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Configuracoes avancadas e informacoes do sistema
                </p>
              </div>
            </div>

            {/* System Info Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: 'Versao do NEXUS', value: 'v3.0.0', icon: Box, color: '#6366F1' },
                { label: 'Versao do Banco', value: 'SQLite 3.42', icon: Database, color: '#8B5CF6' },
                {
                  label: 'Status Ollama',
                  value: (
                    <span className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                      Online
                    </span>
                  ),
                  icon: Brain,
                  color: '#3B82F6',
                },
                {
                  label: 'Espaco em Disco',
                  value: '4.2 GB / 20 GB',
                  icon: HardDrive,
                  color: '#10B981',
                  progress: 21,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border p-4"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon size={16} style={{ color: item.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.value}
                    </p>
                    {'progress' in item && item.progress !== undefined && (
                      <div
                        className="mt-2 h-2 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: 'var(--border-light)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Last update */}
            <div className="mb-6">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ultima Atualizacao:{' '}
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </p>
            </div>

            {/* Check Updates */}
            <button
              className="mb-8 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
              onClick={() => alert('Seu NEXUS AI esta atualizado!')}
            >
              <RefreshCw size={16} />
              Verificar Atualizacoes
            </button>

            {/* Danger Zone */}
            <div
              className="rounded-xl border-2 p-5"
              style={{ borderColor: 'var(--danger-light)', backgroundColor: 'rgba(239,68,68,0.02)' }}
            >
              <h3 className="mb-1 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--danger)' }}>
                <AlertTriangle size={18} />
                Zona de Perigo
              </h3>
              <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                Acoes irreversiveis. Tenha certeza do que esta fazendo.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (window.confirm('ATENCAO: Isso excluira TODOS os dados do sistema. Deseja continuar?')) {
                      alert('Dados excluidos (simulacao)');
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all"
                  style={{ backgroundColor: 'var(--danger)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  <Trash2 size={16} />
                  Limpar Todos os Dados
                </button>
                <button
                  className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
                  onClick={() => alert('Backup exportado com sucesso!')}
                >
                  <Download size={16} />
                  Exportar Backup
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* ============================================= */}
      {/* BOTTOM ACTION BAR                              */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-30 border-t px-6 py-3 lg:left-[240px]"
        style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={restaurarPadroes}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
          >
            <RotateCcw size={14} />
            Restaurar Padroes
          </button>

          <div className="flex items-center gap-3">
            {/* Unsaved indicator */}
            <AnimatePresence>
              {salvoSucesso && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--success)' }}
                >
                  <CheckCircle size={16} />
                  Configuracoes salvas!
                </motion.span>
              )}
            </AnimatePresence>

            <motion.button
              onClick={salvarConfig}
              disabled={salvando}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: 'var(--primary)',
                boxShadow: '0 1px 2px rgba(99,102,241,0.3)',
              }}
              whileHover={!salvando ? { scale: 1.02 } : {}}
              whileTap={!salvando ? { scale: 0.98 } : {}}
            >
              {salvando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {salvando ? 'Salvando...' : 'Salvar Configuracoes'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-16" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Extra icon components for notification toggles                     */
/* ------------------------------------------------------------------ */

function VolumeIcon({ size, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={style?.color || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function FileBarChartIcon({ size, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={style?.color || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-6" />
      <path d="M8 18v-4" />
      <path d="M16 18v-8" />
    </svg>
  );
}

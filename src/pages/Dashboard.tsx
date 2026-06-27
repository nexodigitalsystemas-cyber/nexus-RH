import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Zap,
  Clock,
  FileCheck,
  Users,
  BarChart3,
  FileText,
  ClipboardList,
  ChevronRight,
  FileText as FileTextIcon,
  Table,
  FileEdit,
  Sheet,
  Archive,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  chartData,
  categoryPerformance,
  formatFileSize,
  getStatusLabel,
  getStatusColor,
} from '@/data/mockData';
import { useTasks } from '@/hooks/useTasks';
import { useFiles } from '@/hooks/useFiles';
import { useDashboard } from '@/hooks/useDashboard';

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = '', duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString('pt-BR')}{suffix}</span>;
}

/* ─── KPI Card ─── */
interface KpiCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: React.ReactNode;
  subtitle: string;
  trend?: string;
  trendColor?: string;
  extra?: React.ReactNode;
  delay?: number;
}

function KpiCard({ icon: Icon, iconBg, iconColor, value, subtitle, trend, trendColor = '#10B981', extra, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
      whileHover={{ y: -2 }}
      className="rounded-xl border p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        {trend && (
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: trendColor + '20', color: trendColor }}>
            {trend}
          </span>
        )}
      </div>
      <div className="mb-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {subtitle}
      </p>
      {extra}
    </motion.div>
  );
}

/* ─── File Type Icon Helper ─── */
function FileTypeIcon({ type, size = 18 }: { type: string; size?: number }) {
  const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    PDF: { icon: FileTextIcon, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    XLSX: { icon: Table, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    DOCX: { icon: FileEdit, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    CSV: { icon: Sheet, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    ZIP: { icon: Archive, color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  };
  const config = iconMap[type] || iconMap.ZIP;
  const Icon = config.icon;
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: config.bg }}>
      <Icon size={size} style={{ color: config.color }} />
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading } = useTasks();
  const { files, loading: filesLoading } = useFiles({ status: 'active' });
  const { metrics, loading: metricsLoading } = useDashboard();

  const recentTasks = tasks.slice(0, 5);
  const recentFiles = files.slice(0, 6);
  const dashboardMetrics = metrics ?? {
    tasksCompleted: 0,
    tasksTotal: 1,
    efficiency: 0,
    timeSaved: 0,
    filesProcessed: 0,
    pendingTasks: 0,
    pendingBreakdown: '',
  };

  const isLoading = tasksLoading || filesLoading || metricsLoading;

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-xl border p-4 text-center text-sm" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          Carregando dados do servidor...
        </div>
      )}

      {/* ─── KPI Cards Row ─── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          iconBg="rgba(99,102,241,0.1)"
          iconColor="#6366F1"
          value={`${dashboardMetrics.tasksCompleted}/${dashboardMetrics.tasksTotal}`}
          subtitle="tarefas concluidas hoje"
          trend="+12%"
          delay={0}
          extra={
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--border-light)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(dashboardMetrics.tasksCompleted / dashboardMetrics.tasksTotal) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
              />
            </div>
          }
        />
        <KpiCard
          icon={Zap}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10B981"
          value={<AnimatedCounter value={dashboardMetrics.efficiency} suffix="%" />}
          subtitle="vs mes anterior"
          trend="+12%"
          trendColor="#10B981"
          delay={80}
        />
        <KpiCard
          icon={Clock}
          iconBg="rgba(59,130,246,0.1)"
          iconColor="#3B82F6"
          value={`${dashboardMetrics.timeSaved}h`}
          subtitle="este mes"
          trend="+2.5h"
          trendColor="#3B82F6"
          delay={160}
        />
        <KpiCard
          icon={FileCheck}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#F59E0B"
          value={<AnimatedCounter value={dashboardMetrics.filesProcessed} />}
          subtitle="total"
          trend="+23"
          trendColor="#F59E0B"
          delay={240}
          extra={
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {dashboardMetrics.pendingBreakdown}
            </p>
          }
        />
      </div>

      {/* ─── Charts + Recent Tasks Row ─── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl border p-6 shadow-card xl:col-span-2"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Atividade dos Ultimos 7 Dias
          </h3>
          <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Operacoes processadas por dia
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
                formatter={(value: number) => [`${value} tarefas`, 'Tarefas']}
                labelStyle={{ color: 'var(--text-muted)' }}
              />
              <Area
                type="monotone"
                dataKey="tasks"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#areaGradient)"
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border p-6 shadow-card"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tarefas Recentes
          </h3>
          <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Ultimas 5 tarefas criadas
          </p>
          <div className="space-y-1">
            {recentTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
                onClick={() => navigate('/tarefas')}
                className="group flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-all duration-150 hover:translate-x-1"
                style={{ '--hover-bg': 'var(--surface-hover)' } as React.CSSProperties}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getStatusColor(task.status) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {task.category} · {getStatusLabel(task.status)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => navigate('/tarefas')}
            className="mt-3 flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
            style={{ color: '#6366F1' }}
          >
            Ver todas as tarefas
            <ChevronRight size={14} />
          </button>
        </motion.div>
      </div>

      {/* ─── Files + Quick Actions Row ─── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Monitored Files */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl border p-6 shadow-card"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Arquivos Monitorados
          </h3>
          <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Ultimos arquivos processados
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recentFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.5 + index * 0.06 }}
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                onClick={() => navigate('/arquivos')}
                className="group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-200"
                style={{ borderColor: 'var(--border)' }}
              >
                <FileTypeIcon type={file.file_type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {file.file_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatFileSize(file.file_size)} · {file.file_type}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => navigate('/arquivos')}
            className="mt-4 flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
            style={{ color: '#6366F1' }}
          >
            Ver todos os arquivos
            <ChevronRight size={14} />
          </button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl border p-6 shadow-card"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Acoes Rapidas
          </h3>
          <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Inicie uma acao com um clique
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Processar Curriculos', icon: Users, color: '#6366F1', path: '/tarefas' },
              { label: 'Conciliar Vendas', icon: BarChart3, color: '#8B5CF6', path: '/tarefas' },
              { label: 'Gerar Relatorio', icon: FileText, color: '#10B981', path: '/relatorios' },
              { label: 'Ver Tarefas', icon: ClipboardList, color: '#F59E0B', path: '/tarefas' },
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.6 + index * 0.08 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200 hover:shadow-card-hover"
                  style={{ borderColor: 'var(--border)', minHeight: 100 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Icon size={28} style={{ color: action.color }} />
                  <span className="text-center text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ─── Category Performance ─── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="rounded-xl border p-6 shadow-card"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Desempenho por Categoria
        </h3>
        <p className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          Taxa de conclusao de tarefas por departamento
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {categoryPerformance.map((cat, index) => (
            <div key={cat.category}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {cat.category}
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {cat.rate}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--border-light)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.rate}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.7 + index * 0.15,
                    ease: [0, 0, 0.2, 1] as [number, number, number, number],
                  }}
                  className={`h-full rounded-full bg-gradient-to-r ${cat.gradient}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

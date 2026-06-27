import { useState, useMemo, useRef, useEffect } from 'react';
import type { Task } from '@/types';
import { mockTasks, getStatusLabel, getStatusColor, getTypeLabel, getTypeColor } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  X,
  LayoutGrid,
  AlignJustify,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  AlertOctagon,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  ChevronDown,
  Filter,
  Layers,
  AlertTriangle,
} from 'lucide-react';

/* ─── Status & Priority helpers ─── */

const STATUS_CONFIG = [
  { key: 'pending', label: 'Pendente', color: '#F59E0B' },
  { key: 'in_progress', label: 'Em Andamento', color: '#3B82F6' },
  { key: 'completed', label: 'Concluida', color: '#10B981' },
  { key: 'cancelled', label: 'Cancelada', color: '#EF4444' },
] as const;

const PRIORITY_CONFIG = [
  { key: 'urgent', label: 'Urgente', color: '#EF4444', icon: AlertOctagon },
  { key: 'high', label: 'Alta', color: '#F59E0B', icon: ArrowUp },
  { key: 'medium', label: 'Media', color: '#3B82F6', icon: Minus },
  { key: 'low', label: 'Baixa', color: '#94A3B8', icon: ArrowDown },
] as const;

const CATEGORIES = ['RH', 'Financeiro', 'Comercial', 'Operacional'] as const;

const PRIORITY_BORDER: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#94A3B8',
};

const CATEGORY_DOT: Record<string, string> = {
  RH: '#8B5CF6',
  Financeiro: '#3B82F6',
  Comercial: '#F59E0B',
  Operacional: '#10B981',
};

const CATEGORY_BG: Record<string, string> = {
  RH: 'rgba(139,92,246,0.1)',
  Financeiro: 'rgba(59,130,246,0.1)',
  Comercial: 'rgba(245,158,11,0.1)',
  Operacional: 'rgba(16,185,129,0.1)',
};

const CATEGORY_TEXT: Record<string, string> = {
  RH: '#8B5CF6',
  Financeiro: '#3B82F6',
  Comercial: '#F59E0B',
  Operacional: '#10B981',
};

/* ─── Relative time helper ─── */

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `ha ${diffMin} min`;
  if (diffHr < 24) return `ha ${diffHr} h`;
  if (diffDay === 1) return 'ontem';
  if (diffDay < 7) return `ha ${diffDay} dias`;
  return date.toLocaleDateString('pt-BR');
}

/* ─── Types ─── */

type ViewMode = 'board' | 'list';
type SortField = 'title' | 'category' | 'type' | 'priority' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

/* ─── Main Component ─── */

export default function Tarefas() {
  /* State */
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todas');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteModal, setDeleteModal] = useState<Task | null>(null);

  /* Context menu */
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: Task } | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ─── Filtering ─── */
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (catFilter !== 'Todas') list = list.filter((t) => t.category === catFilter);
    if (statusFilter !== 'Todos') list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'Todas') list = list.filter((t) => t.priority === priorityFilter);

    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'created_at') {
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      if (sortField === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return dir * ((order[a.priority] ?? 2) - (order[b.priority] ?? 2));
      }
      return dir * String(a[sortField] || '').localeCompare(String(b[sortField] || ''));
    });

    return list;
  }, [tasks, search, catFilter, statusFilter, priorityFilter, sortField, sortDir]);

  /* ─── Column groups ─── */
  const columnTasks = (status: string) => filteredTasks.filter((t) => t.status === status);

  /* ─── Handlers ─── */
  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
    setContextMenu(null);
  };

  const confirmDelete = (task: Task) => {
    setDeleteModal(task);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (deleteModal) {
      setTasks((prev) => prev.filter((t) => t.id !== deleteModal.id));
      setDeleteModal(null);
    }
  };

  const handleSave = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, ...taskData, updated_at: new Date().toISOString() } : t
        )
      );
    } else {
      const newTask: Task = {
        ...taskData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setModalOpen(false);
  };

  const handleDuplicate = (task: Task) => {
    const dup: Task = {
      ...task,
      id: Date.now(),
      title: `${task.title} (Copia)`,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [dup, ...prev]);
    setContextMenu(null);
  };

  const handleStatusChange = (task: Task, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as Task['status'], updated_at: new Date().toISOString() } : t))
    );
    setContextMenu(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* ─── Render ─── */

  return (
    <div className="flex flex-col" style={{ backgroundColor: 'var(--bg)', minHeight: 'calc(100dvh - 56px)' }}>
      {/* ── Header + Filters ── */}
      <div className="sticky top-0 z-30 border-b px-6 py-4" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative" style={{ width: 280 }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border pl-9 pr-9 text-sm outline-none transition-all"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category filter */}
            <DropdownFilter
              icon={<Filter size={14} />}
              label={catFilter === 'Todas' ? 'Categoria' : catFilter}
              options={['Todas', ...CATEGORIES]}
              value={catFilter}
              onChange={setCatFilter}
              renderOption={(opt) => (
                <span className="flex items-center gap-2">
                  {opt !== 'Todas' && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_DOT[opt] }} />}
                  {opt}
                </span>
              )}
            />

            {/* Status filter */}
            <DropdownFilter
              icon={<Layers size={14} />}
              label={statusFilter === 'Todos' ? 'Status' : getStatusLabel(statusFilter)}
              options={['Todos', ...STATUS_CONFIG.map((s) => s.key)]}
              value={statusFilter}
              onChange={setStatusFilter}
              renderOption={(opt) =>
                opt === 'Todos' ? (
                  'Todos'
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getStatusColor(opt) }} />
                    {getStatusLabel(opt)}
                  </span>
                )
              }
            />

            {/* Priority filter */}
            <DropdownFilter
              icon={<AlertTriangle size={14} />}
              label={priorityFilter === 'Todas' ? 'Prioridade' : PRIORITY_CONFIG.find((p) => p.key === priorityFilter)?.label || priorityFilter}
              options={['Todas', ...PRIORITY_CONFIG.map((p) => p.key)]}
              value={priorityFilter}
              onChange={setPriorityFilter}
              renderOption={(opt) =>
                opt === 'Todas' ? (
                  'Todas'
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG.find((p) => p.key === opt)?.color }} />
                    {PRIORITY_CONFIG.find((p) => p.key === opt)?.label}
                  </span>
                )
              }
            />

            {/* View toggle */}
            <div className="flex items-center rounded-lg p-1" style={{ backgroundColor: 'var(--border-light)' }}>
              <button
                onClick={() => setViewMode('list')}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-all"
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                aria-label="Visualizacao em lista"
              >
                <AlignJustify size={16} />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-all"
                style={{
                  backgroundColor: viewMode === 'board' ? 'var(--surface)' : 'transparent',
                  color: viewMode === 'board' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'board' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                aria-label="Visualizacao em quadro"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Nova Tarefa button */}
            <button
              onClick={openCreate}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: 'var(--primary)', boxShadow: '0 1px 2px rgba(99,102,241,0.3)' }}
            >
              <Plus size={16} />
              Nova Tarefa
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-6 py-6">
        <AnimatePresence mode="wait">
          {viewMode === 'board' ? (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-5 overflow-x-auto pb-4"
              style={{ minHeight: 'calc(100dvh - 200px)' }}
            >
              {STATUS_CONFIG.map((col, ci) => (
                <motion.div
                  key={col.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: ci * 0.1, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
                  className="flex shrink-0 flex-col rounded-xl border"
                  style={{
                    width: 300,
                    backgroundColor: 'rgba(241,245,249,0.5)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: col.color }}>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                      <span className="text-[13px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                        {col.label}
                      </span>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}
                    >
                      {columnTasks(col.key).length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-3" style={{ minHeight: 120 }}>
                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {columnTasks(col.key).map((task, ti) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={ti}
                            onEdit={() => openEdit(task)}

                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({ x: e.clientX, y: e.clientY, task });
                            }}
                          />
                        ))}
                      </AnimatePresence>
                      {columnTasks(col.key).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 opacity-40">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhuma tarefa</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={openCreate}
                    className="mx-3 mb-3 flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Plus size={14} />
                    Adicionar tarefa
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <ListView
              key="list"
              tasks={filteredTasks}
              sortField={sortField}
              sortDir={sortDir}
              onSort={toggleSort}
              onEdit={openEdit}
              onDelete={confirmDelete}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Context Menu ── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 w-44 overflow-hidden rounded-lg border py-1 shadow-lg"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 240),
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <button
              onClick={() => openEdit(contextMenu.task)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Pencil size={14} /> Editar
            </button>
            {STATUS_CONFIG.filter((s) => s.key !== contextMenu.task.status).map((s) => (
              <button
                key={s.key}
                onClick={() => handleStatusChange(contextMenu.task, s.key)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                Mover para {s.label}
              </button>
            ))}
            <button
              onClick={() => handleDuplicate(contextMenu.task)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Copy size={14} /> Duplicar
            </button>
            <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
            <button
              onClick={() => confirmDelete(contextMenu.task)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Trash2 size={14} /> Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Task Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <TaskModal
            task={editingTask}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ── */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Excluir Tarefa?
              </h3>
              <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                Tem certeza que deseja excluir "<span className="font-medium">{deleteModal.title}</span>"? Esta acao nao pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="h-10 rounded-lg border px-4 text-sm font-medium transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--danger)' }}
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Task Card
   ═══════════════════════════════════════════ */

function TaskCard({
  task,
  index,
  onEdit,
  onContextMenu,
}: {
  task: Task;
  index: number;
  onEdit: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const priority = PRIORITY_CONFIG.find((p) => p.key === task.priority) ?? PRIORITY_CONFIG[2];
  const PriorityIcon = priority.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
      className="group relative cursor-pointer rounded-xl border p-4 transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        borderLeftWidth: 3,
        borderLeftColor: PRIORITY_BORDER[task.priority],
      }}
      onClick={onEdit}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = 'var(--primary-light)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Tags row */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: CATEGORY_BG[task.category], color: CATEGORY_TEXT[task.category] }}
        >
          {task.category}
        </span>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            backgroundColor: task.priority === 'urgent' ? 'var(--danger-light)' : task.priority === 'high' ? 'var(--warning-light)' : task.priority === 'medium' ? 'var(--info-light)' : 'var(--border-light)',
            color: priority.color,
          }}
        >
          <PriorityIcon size={10} />
          {priority.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="mb-1 text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="mb-3 text-[13px] line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {task.description}
        </p>
      )}

      {/* File attachment */}
      {task.file_name && (
        <div
          className="mb-3 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs"
          style={{ backgroundColor: 'var(--surface-hover)' }}
        >
          <span style={{ color: 'var(--primary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
          <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{task.file_name}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span
            className="inline-block h-4 w-4 rounded-full"
            style={{ backgroundColor: getTypeColor(task.type) }}
          />
          <span>{getTypeLabel(task.type)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {relativeTime(task.created_at)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
            className="flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Mais opcoes"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   List View
   ═══════════════════════════════════════════ */

function ListView({
  tasks,
  sortField,
  sortDir,
  onSort,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const headers: { field: SortField; label: string }[] = [
    { field: 'title', label: 'Titulo' },
    { field: 'category', label: 'Categoria' },
    { field: 'type', label: 'Tipo' },
    { field: 'priority', label: 'Prioridade' },
    { field: 'status', label: 'Status' },
    { field: 'created_at', label: 'Data' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="overflow-hidden rounded-xl border"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--border-light)' }}>
              {headers.map((h) => (
                <th
                  key={h.field}
                  onClick={() => onSort(h.field)}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="flex items-center gap-1">
                    {h.label}
                    {sortField === h.field && (
                      sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {tasks.map((task) => {
                const priority = PRIORITY_CONFIG.find((p) => p.key === task.priority) ?? PRIORITY_CONFIG[2];
                const statusCfg = STATUS_CONFIG.find((s) => s.key === task.status);

                return (
                  <motion.tr
                    key={task.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="cursor-pointer border-b transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => onEdit(task)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: CATEGORY_BG[task.category], color: CATEGORY_TEXT[task.category] }}
                      >
                        {task.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getTypeColor(task.type) }} />
                        {getTypeLabel(task.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: task.priority === 'urgent' ? 'var(--danger-light)' : task.priority === 'high' ? 'var(--warning-light)' : task.priority === 'medium' ? 'var(--info-light)' : 'var(--border-light)',
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusCfg?.color }} />
                        {statusCfg?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {relativeTime(task.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          aria-label="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'var(--danger)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          aria-label="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma tarefa encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Task Modal (Create / Edit)
   ═══════════════════════════════════════════ */

function TaskModal({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [type, setType] = useState<string>(task?.type || 'custom');
  const [category, setCategory] = useState<string>(task?.category || 'RH');
  const [priority, setPriority] = useState<string>(task?.priority || 'medium');
  const [status, setStatus] = useState<string>(task?.status || 'pending');
  const [titleError, setTitleError] = useState('');

  const isEditing = !!task;
  const isValid = title.trim().length >= 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setTitleError('O titulo deve ter pelo menos 3 caracteres');
      return;
    }
    onSave({ title: title.trim(), description, type: type as Task['type'], category: category as Task['category'], priority: priority as Task['priority'], status: status as Task['status'] });
  };

  const TYPES: { key: string; label: string }[] = [
    { key: 'cv-analysis', label: 'Analise de CV' },
    { key: 'invoice-processing', label: 'Processamento de NF' },
    { key: 'contract-review', label: 'Revisao de Contrato' },
    { key: 'report-generation', label: 'Geracao de Relatorio' },
    { key: 'file-organization', label: 'Organizacao de Arquivos' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
        className="w-full max-w-[560px] overflow-hidden rounded-2xl border shadow-xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-8 py-5" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          <div className="space-y-5">
            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Titulo <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
                className="h-11 w-full rounded-lg border px-4 text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: titleError ? 'var(--danger)' : 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { if (!titleError) e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = titleError ? 'var(--danger)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Digite o titulo da tarefa"
              />
              {titleError && <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>{titleError}</p>}
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Descricao
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition-all"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Descreva a tarefa..."
              />
            </motion.div>

            {/* Row: Category + Type + Priority */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                <Select value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
                <Select value={type} onChange={setType} options={TYPES.map((t) => ({ value: t.key, label: t.label }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Prioridade</label>
                <Select
                  value={priority}
                  onChange={setPriority}
                  options={PRIORITY_CONFIG.map((p) => ({ value: p.key, label: p.label }))}
                />
              </div>
            </motion.div>

            {/* Row: Status */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <Select
                  value={status}
                  onChange={setStatus}
                  options={STATUS_CONFIG.map((s) => ({ value: s.key, label: s.label }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Arquivo relacionado</label>
                <input
                  type="file"
                  className="h-11 w-full rounded-lg border px-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary)] file:px-3 file:py-1 file:text-xs file:text-white"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border px-5 text-sm font-medium transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="h-11 rounded-lg px-6 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)', boxShadow: '0 1px 2px rgba(99,102,241,0.3)' }}
            >
              {isEditing ? 'Salvar Alteracoes' : 'Salvar Tarefa'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Dropdown Filter
   ═══════════════════════════════════════════ */

function DropdownFilter({
  icon,
  label,
  options,
  value,
  onChange,
  renderOption,
}: {
  icon: React.ReactNode;
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  renderOption?: (opt: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-lg border py-1 shadow-lg"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors"
                style={{
                  color: value === opt ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: value === opt ? 'rgba(99,102,241,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="flex items-center gap-2">
                  {renderOption ? renderOption(opt) : opt}
                </span>
                {value === opt && <Check size={14} style={{ color: 'var(--primary)' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Select Input
   ═══════════════════════════════════════════ */

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-lg border pl-3 pr-8 text-sm outline-none transition-all"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}

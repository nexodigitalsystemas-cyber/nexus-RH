import { useState, useMemo, useRef, useCallback } from 'react';
import type { ProcessedFile } from '@/types';
import { mockFiles, formatFileSize } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  LayoutGrid,
  AlignJustify,
  Folder,
  FolderOpen,
  FolderPlus,
  Upload,
  UploadCloud,
  FileText,
  Table,
  FileEdit,
  Sheet,
  Archive,
  Image,
  Trash2,
  Download,
  Wand2,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  File,
} from 'lucide-react';

/* ─── Types ─── */

interface FileItem extends ProcessedFile {
  status?: 'active' | 'processing' | 'trash';
  folder?: string;
  category?: 'RH' | 'Financeiro' | 'Comercial' | 'Operacional' | 'unclassified';
}

type ViewMode = 'grid' | 'list';
type SortField = 'file_name' | 'file_size' | 'file_type' | 'created_at';
type SortDir = 'asc' | 'desc';

interface FolderItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  count: number;
}

/* ─── Helpers ─── */

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

function getFileIcon(type: string) {
  switch (type.toUpperCase()) {
    case 'PDF': return FileText;
    case 'XLSX':
    case 'XLS': return Table;
    case 'DOCX':
    case 'DOC': return FileEdit;
    case 'CSV': return Sheet;
    case 'ZIP':
    case 'RAR': return Archive;
    case 'JPG':
    case 'JPEG':
    case 'PNG':
    case 'GIF': return Image;
    default: return File;
  }
}

function getFileIconColor(type: string): string {
  switch (type.toUpperCase()) {
    case 'PDF': return '#EF4444';
    case 'XLSX':
    case 'XLS': return '#10B981';
    case 'DOCX':
    case 'DOC': return '#3B82F6';
    case 'CSV': return '#F59E0B';
    case 'ZIP':
    case 'RAR': return '#94A3B8';
    case 'JPG':
    case 'JPEG':
    case 'PNG': return '#8B5CF6';
    default: return '#64748B';
  }
}

function getFileIconBg(type: string): string {
  switch (type.toUpperCase()) {
    case 'PDF': return 'rgba(239,68,68,0.08)';
    case 'XLSX':
    case 'XLS': return 'rgba(16,185,129,0.08)';
    case 'DOCX':
    case 'DOC': return 'rgba(59,130,246,0.08)';
    case 'CSV': return 'rgba(245,158,11,0.08)';
    case 'ZIP':
    case 'RAR': return 'rgba(100,116,139,0.08)';
    case 'JPG':
    case 'JPEG':
    case 'PNG': return 'rgba(139,92,246,0.08)';
    default: return 'rgba(100,116,139,0.08)';
  }
}

/* ─── Enriched mock files with category/folder ─── */

const FILE_CATEGORIES: Record<number, FileItem['category']> = {
  1: 'RH',
  2: 'Financeiro',
  3: 'Operacional',
  4: 'Financeiro',
  5: 'Comercial',
  6: 'Operacional',
};

const FILE_FOLDERS: Record<number, string> = {
  1: 'RH',
  2: 'Financeiro',
  3: 'Operacional',
  4: 'Financeiro',
  5: 'Comercial',
  6: 'Operacional',
};

const initialFiles: FileItem[] = mockFiles.map((f) => ({
  ...f,
  category: FILE_CATEGORIES[f.id] || 'unclassified',
  folder: FILE_FOLDERS[f.id] || 'unclassified',
  status: 'active' as const,
}));

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */

export default function Arquivos() {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [activeFolder, setActiveFolder] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* Upload state */
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number; status: string }[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Preview modal */
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  /* New folder input */
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  /* ─── Derived folders ─── */
  const folders: FolderItem[] = useMemo(() => {
    const counts: Record<string, number> = { all: files.filter((f) => f.status !== 'trash').length };
    for (const f of files) {
      if (f.status === 'trash') {
        counts.trash = (counts.trash || 0) + 1;
        continue;
      }
      if (f.folder) counts[f.folder] = (counts[f.folder] || 0) + 1;
      if (!f.category || f.category === 'unclassified') {
        counts.unclassified = (counts.unclassified || 0) + 1;
      }
    }
    return [
      { id: 'all', name: 'Todos os Arquivos', icon: FolderOpen, color: 'var(--primary)', count: counts.all || 0 },
      { id: 'RH', name: 'RH', icon: Folder, color: '#8B5CF6', count: counts.RH || 0 },
      { id: 'Financeiro', name: 'Financeiro', icon: Folder, color: '#3B82F6', count: counts.Financeiro || 0 },
      { id: 'Comercial', name: 'Comercial', icon: Folder, color: '#F59E0B', count: counts.Comercial || 0 },
      { id: 'Operacional', name: 'Operacional', icon: Folder, color: '#10B981', count: counts.Operacional || 0 },
      { id: 'unclassified', name: 'Nao Classificados', icon: Folder, color: 'var(--text-muted)', count: counts.unclassified || 0 },
      { id: 'trash', name: 'Lixeira', icon: Trash2, color: 'var(--danger)', count: counts.trash || 0 },
    ];
  }, [files]);

  /* ─── Filtered files ─── */
  const filteredFiles = useMemo(() => {
    let list = files;

    if (activeFolder === 'all') {
      list = list.filter((f) => f.status !== 'trash');
    } else if (activeFolder === 'trash') {
      list = list.filter((f) => f.status === 'trash');
    } else if (activeFolder === 'unclassified') {
      list = list.filter((f) => f.status !== 'trash' && (!f.category || f.category === 'unclassified'));
    } else {
      list = list.filter((f) => f.status !== 'trash' && f.folder === activeFolder);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.file_name.toLowerCase().includes(q) ||
          (f.classification?.toLowerCase().includes(q) ?? false) ||
          (f.extracted_text?.toLowerCase().includes(q) ?? false)
      );
    }

    list = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'file_size') return dir * (a.file_size - b.file_size);
      if (sortField === 'created_at') return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return dir * String(a[sortField] || '').localeCompare(String(b[sortField] || ''));
    });

    return list;
  }, [files, activeFolder, search, sortField, sortDir]);

  /* ─── Toggle select ─── */
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  }, [filteredFiles, selectedIds.size]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  /* ─── Drag & Drop ─── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    simulateUpload(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    simulateUpload(selected);
  }, []);

  const simulateUpload = (uploadFiles: File[]) => {
    const progress = uploadFiles.map((f) => ({ name: f.name, progress: 0, status: 'Enviando...' }));
    setUploadProgress(progress);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setUploadProgress((prev) =>
        prev?.map((p) => {
          const prog = Math.min(100, p.progress + Math.random() * 30 + 10);
          let status = p.status;
          if (prog >= 100) status = 'Concluido';
          else if (prog > 60) status = 'Processando...';
          else if (prog > 30) status = 'Classificando...';
          return { ...p, progress: Math.min(100, prog), status };
        }) || null
      );

      if (step >= 8) {
        clearInterval(interval);
        setTimeout(() => {
          setUploadProgress(null);
          // Add uploaded files to state
          const newFiles: FileItem[] = uploadFiles.map((f) => ({
            id: Date.now() + Math.floor(Math.random() * 1000),
            file_name: f.name,
            file_path: `/uploads/${f.name}`,
            file_type: f.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
            file_size: f.size,
            classification: 'Classificando...',
            created_at: new Date().toISOString(),
            category: 'unclassified',
            folder: 'unclassified',
            status: 'active',
          }));
          setFiles((prev) => [...newFiles, ...prev]);
        }, 800);
      }
    }, 300);
  };

  /* ─── Delete selected ─── */
  const deleteSelected = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) => (selectedIds.has(f.id) ? { ...f, status: 'trash' as const } : f))
    );
    setSelectedIds(new Set());
  }, [selectedIds]);

  /* ─── Sort toggle ─── */
  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else { setSortField(field); setSortDir('asc'); }
    },
    [sortField]
  );

  /* ─── Active folder label ─── */
  const activeFolderLabel = folders.find((f) => f.id === activeFolder)?.name || 'Todos os Arquivos';

  /* ─── Render ─── */

  return (
    <div
      className="flex flex-col"
      style={{ backgroundColor: 'var(--bg)', minHeight: 'calc(100dvh - 56px)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Toolbar ── */}
      <div className="border-b px-6 py-4" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative" style={{ width: 320 }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border pl-9 pr-9 text-sm outline-none transition-all"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewFolder(true)}
              className="flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FolderPlus size={16} />
              <span className="hidden sm:inline">Nova Pasta</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: 'var(--primary)', boxShadow: '0 1px 2px rgba(99,102,241,0.3)' }}
            >
              <Upload size={16} />
              Upload
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

            {/* View toggle */}
            <div className="flex items-center rounded-lg p-1" style={{ backgroundColor: 'var(--border-light)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-all"
                style={{
                  backgroundColor: viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                aria-label="Visualizacao em grade"
              >
                <LayoutGrid size={16} />
              </button>
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
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => {
                  const fields: SortField[] = ['file_name', 'created_at', 'file_size', 'file_type'];
                  const idx = fields.indexOf(sortField);
                  toggleSort(fields[(idx + 1) % fields.length]);
                }}
                className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <ArrowUpDown size={14} />
                <span className="hidden sm:inline">
                  {sortField === 'file_name' ? 'Nome' : sortField === 'created_at' ? 'Data' : sortField === 'file_size' ? 'Tamanho' : 'Tipo'}
                </span>
                {sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100dvh - 140px)' }}>
        {/* Folder Sidebar */}
        <aside
          className="hidden w-[200px] shrink-0 overflow-y-auto border-r lg:block"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="py-4">
            {folders.slice(0, 6).map((folder) => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => { setActiveFolder(folder.id); setSelectedIds(new Set()); }}
                  className="flex w-full items-center justify-between px-5 py-3 text-left transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} style={{ color: folder.color }} />
                    <span className="text-sm font-medium" style={{ color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {folder.name}
                    </span>
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{folder.count}</span>
                </button>
              );
            })}

            {/* Trash */}
            <div className="mx-4 my-2 border-t" style={{ borderColor: 'var(--border)' }} />
            <TrashFolderRow folders={folders} activeFolder={activeFolder} onSelect={setActiveFolder} onClearSelected={setSelectedIds} />

            {/* New folder input */}
            <AnimatePresence>
              {showNewFolder && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Nome da pasta"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newFolderName.trim()) {
                          setShowNewFolder(false);
                          setNewFolderName('');
                        }
                        if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
                      }}
                      className="h-9 flex-1 rounded-lg border px-3 text-sm outline-none"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* File Display Area */}
        <main className="flex-1 overflow-y-auto p-5">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Documentos &gt; </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{activeFolderLabel}</span>
              <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>({filteredFiles.length} arquivos)</span>
            </div>
          </div>

          {/* Files */}
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <FileGrid
                key="grid"
                files={filteredFiles}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onPreview={setPreviewFile}
              />
            ) : (
              <FileList
                key="list"
                files={filteredFiles}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onPreview={setPreviewFile}
                sortField={sortField}
                sortDir={sortDir}
                onSort={toggleSort}
              />
            )}
          </AnimatePresence>

          {/* Empty state */}
          {filteredFiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Search size={48} style={{ color: 'var(--text-muted)' }} className="mb-4 opacity-30" />
              <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {search ? 'Nenhum arquivo encontrado' : 'Esta pasta esta vazia'}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {search ? 'Tente outros termos de busca' : 'Arquivos classificados nesta categoria aparecerao aqui'}
              </p>
            </motion.div>
          )}
        </main>
      </div>

      {/* ── Drag & Drop Overlay ── */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(99,102,241,0.06)', backdropFilter: 'blur(2px)' }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed"
              style={{
                width: 400,
                height: 240,
                borderColor: 'var(--primary)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <UploadCloud size={64} style={{ color: 'var(--primary)' }} className="mb-4" />
              <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--primary)' }}>
                Solte os arquivos aqui
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Suporta PDF, Excel, Word, CSV, imagens e ZIP
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload Progress Overlay ── */}
      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Enviando arquivos
              </h3>
              <div className="space-y-4">
                {uploadProgress.map((f, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.status}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--border-light)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${f.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview Modal ── */}
      <AnimatePresence>
        {previewFile && (
          <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        )}
      </AnimatePresence>

      {/* ── Multi-Select Action Bar ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl border px-5 py-3 shadow-xl"
            style={{ backgroundColor: 'var(--text-primary)', borderColor: 'var(--text-primary)', color: 'white' }}
          >
            <span className="text-sm font-medium">
              {selectedIds.size} arquivo{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="h-5 w-px bg-white/20" />
            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
            >
              <CheckSquare size={14} />
              Desmarcar
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
              style={{ color: 'var(--danger-light)' }}
            >
              <Trash2 size={14} />
              Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   File Grid View
   ═══════════════════════════════════════════ */

function FileGrid({
  files,
  selectedIds,
  onToggleSelect,
  onPreview,
}: {
  files: FileItem[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onPreview: (f: FileItem) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
    >
      <AnimatePresence>
        {files.map((file, i) => {
          const Icon = getFileIcon(file.file_type);
          const iconColor = getFileIconColor(file.file_type);
          const iconBg = getFileIconBg(file.file_type);
          const isSelected = selectedIds.has(file.id);

          return (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
              className="group relative cursor-pointer rounded-xl border p-4 text-center transition-all"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                boxShadow: isSelected ? '0 0 0 2px rgba(99,102,241,0.3)' : 'none',
              }}
              onClick={() => onPreview(file)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary-light)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              {/* Checkbox on hover */}
              <div
                className="absolute left-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ opacity: isSelected ? 1 : undefined }}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(file.id); }}
              >
                {isSelected ? (
                  <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
                ) : (
                  <Square size={18} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              {/* File icon */}
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ backgroundColor: iconBg }}
              >
                <Icon size={32} style={{ color: iconColor }} />
              </div>

              {/* Filename */}
              <p className="mb-1 truncate text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {file.file_name}
              </p>

              {/* Size + Type */}
              <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatFileSize(file.file_size)} &middot; {file.file_type}
              </p>

              {/* Category badge */}
              {file.category && file.category !== 'unclassified' && (
                <span
                  className="mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: file.category === 'RH' ? 'rgba(139,92,246,0.1)' : file.category === 'Financeiro' ? 'rgba(59,130,246,0.1)' : file.category === 'Comercial' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    color: file.category === 'RH' ? '#8B5CF6' : file.category === 'Financeiro' ? '#3B82F6' : file.category === 'Comercial' ? '#F59E0B' : '#10B981',
                  }}
                >
                  {file.category}
                </span>
              )}

              {/* Classification */}
              {file.classification && (
                <p className="truncate text-[11px]" style={{ color: 'var(--primary)' }}>
                  {file.classification}
                </p>
              )}

              {/* Timestamp */}
              <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {relativeTime(file.created_at)}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   File List View
   ═══════════════════════════════════════════ */

function FileList({
  files,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onPreview,
  sortField,
  sortDir,
  onSort,
}: {
  files: FileItem[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onPreview: (f: FileItem) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const headers: { field: SortField; label: string }[] = [
    { field: 'file_name', label: 'Nome' },
    { field: 'file_type', label: 'Tipo' },
    { field: 'file_size', label: 'Tamanho' },
    { field: 'created_at', label: 'Data' },
  ];

  const allSelected = files.length > 0 && selectedIds.size === files.length;

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
              <th className="w-10 px-3 py-3">
                <button onClick={onSelectAll} style={{ color: 'var(--text-muted)' }} aria-label="Selecionar todos">
                  {allSelected ? <CheckSquare size={16} style={{ color: 'var(--primary)' }} /> : <Square size={16} />}
                </button>
              </th>
              {headers.map((h) => (
                <th
                  key={h.field}
                  onClick={() => onSort(h.field)}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="flex items-center gap-1">
                    {h.label}
                    {sortField === h.field && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Categoria
              </th>
              <th className="w-20 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {files.map((file) => {
                const Icon = getFileIcon(file.file_type);
                const iconColor = getFileIconColor(file.file_type);
                const isSelected = selectedIds.has(file.id);

                return (
                  <motion.tr
                    key={file.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="cursor-pointer border-b transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: isSelected ? 'rgba(99,102,241,0.05)' : 'transparent',
                    }}
                    onClick={() => onPreview(file)}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onToggleSelect(file.id)} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <Icon size={18} style={{ color: iconColor }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{file.file_name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: 'var(--border-light)', color: 'var(--text-muted)' }}
                      >
                        {file.file_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {relativeTime(file.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {file.category && file.category !== 'unclassified' ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: file.category === 'RH' ? 'rgba(139,92,246,0.1)' : file.category === 'Financeiro' ? 'rgba(59,130,246,0.1)' : file.category === 'Comercial' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                            color: file.category === 'RH' ? '#8B5CF6' : file.category === 'Financeiro' ? '#3B82F6' : file.category === 'Comercial' ? '#F59E0B' : '#10B981',
                          }}
                        >
                          {file.category}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onPreview(file); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        aria-label="Visualizar"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Preview Modal
   ═══════════════════════════════════════════ */

function PreviewModal({ file, onClose }: { file: FileItem; onClose: () => void }) {
  const Icon = getFileIcon(file.file_type);
  const iconColor = getFileIconColor(file.file_type);
  const iconBg = getFileIconBg(file.file_type);

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
        className="flex w-full max-w-[900px] max-h-[80vh] flex-col overflow-hidden rounded-2xl border shadow-xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <Icon size={20} style={{ color: iconColor }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{file.file_name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label="Baixar"
            >
              <Download size={16} />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label="Excluir"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Preview */}
          <div
            className="hidden w-[40%] items-center justify-center sm:flex"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div
                className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl"
                style={{ backgroundColor: iconBg }}
              >
                <Icon size={48} style={{ color: iconColor }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {file.file_type} &middot; {formatFileSize(file.file_size)}
              </p>
            </motion.div>
          </div>

          {/* Right: Metadata */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Metadata */}
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Metadados
              </h4>
              <div className="space-y-3">
                <MetadataRow label="Nome" value={file.file_name} />
                <MetadataRow label="Tamanho" value={formatFileSize(file.file_size)} />
                <MetadataRow label="Tipo" value={file.file_type} />
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Categoria:</span>
                  {file.category && file.category !== 'unclassified' ? (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: file.category === 'RH' ? 'rgba(139,92,246,0.1)' : file.category === 'Financeiro' ? 'rgba(59,130,246,0.1)' : file.category === 'Comercial' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                        color: file.category === 'RH' ? '#8B5CF6' : file.category === 'Financeiro' ? '#3B82F6' : file.category === 'Comercial' ? '#F59E0B' : '#10B981',
                      }}
                    >
                      {file.category}
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Nao classificado</span>
                  )}
                </div>
                {file.classification && <MetadataRow label="Classificacao" value={file.classification} />}
                <MetadataRow label="Data" value={new Date(file.created_at).toLocaleString('pt-BR')} />
              </div>
            </div>

            {/* Extracted Text */}
            {file.extracted_text && (
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Extracao de Texto
                </h4>
                <div
                  className="max-h-[300px] overflow-y-auto rounded-lg border p-4 text-sm"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {file.extracted_text}
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Acoes
              </h4>
              <div className="flex flex-wrap gap-2">
                <ActionButton icon={<FolderOpen size={14} />} label="Abrir pasta" />
                <ActionButton icon={<Download size={14} />} label="Baixar" />
                <ActionButton icon={<Wand2 size={14} />} label="Reclassificar" variant="secondary" />
                <ActionButton icon={<Trash2 size={14} />} label="Excluir" variant="danger" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}

function ActionButton({ icon, label, variant = 'default' }: { icon: React.ReactNode; label: string; variant?: 'default' | 'secondary' | 'danger' }) {
  const styles =
    variant === 'danger'
      ? { borderColor: 'var(--danger)', color: 'var(--danger)' }
      : variant === 'secondary'
        ? { borderColor: 'var(--secondary)', color: 'var(--secondary)' }
        : { borderColor: 'var(--border)', color: 'var(--text-secondary)' };

  return (
    <button
      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all"
      style={styles}
      onMouseEnter={(e) => {
        if (variant === 'danger') e.currentTarget.style.backgroundColor = 'var(--danger-light)';
        else if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.05)';
        else e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon}
      {label}
    </button>
  );
}


/* Trash folder row */
function TrashFolderRow({
  folders,
  activeFolder,
  onSelect,
  onClearSelected,
}: {
  folders: FolderItem[];
  activeFolder: string;
  onSelect: (id: string) => void;
  onClearSelected: (ids: Set<number>) => void;
}) {
  const folder = folders[6];
  if (!folder) return null;
  const Icon = folder.icon;
  const isActive = activeFolder === folder.id;
  return (
    <button
      onClick={() => { onSelect(folder.id); onClearSelected(new Set()); }}
      className="flex w-full items-center justify-between px-5 py-3 text-left transition-all"
      style={{
        backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span className="flex items-center gap-3">
        <Icon size={18} style={{ color: folder.color }} />
        <span className="text-sm font-medium" style={{ color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}>
          {folder.name}
        </span>
      </span>
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{folder.count}</span>
    </button>
  );
}

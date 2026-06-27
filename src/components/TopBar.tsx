import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell, Plus, Wifi } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Visao geral do sistema' },
  '/agente': { title: 'Agente', subtitle: 'Interaja com a IA' },
  '/tarefas': { title: 'Tarefas', subtitle: 'Gerencie suas tarefas' },
  '/arquivos': { title: 'Arquivos', subtitle: 'Arquivos processados' },
  '/relatorios': { title: 'Relatorios', subtitle: 'Relatorios gerados' },
  '/configuracoes': { title: 'Configuracoes', subtitle: 'Ajustes do sistema' },
};

export default function TopBar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const currentPage = pageTitles[location.pathname] || { title: 'Dashboard', subtitle: 'Visao geral do sistema' };

  const formatDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return now.toLocaleDateString('pt-BR', options);
  };

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b px-6"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Left: Page title + subtitle */}
      <div className="ml-12 lg:ml-0">
        <h1
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {currentPage.title}
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {currentPage.subtitle} &middot; {formatDate()}
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notification Bell */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Notificacoes"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </button>

        {/* Connection Status Pill */}
        <div
          className="hidden items-center gap-1.5 rounded-full border px-3 py-1 sm:flex"
          style={{ borderColor: 'var(--border)' }}
        >
          <Wifi size={14} style={{ color: '#10B981' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Online
          </span>
        </div>

        {/* Nova Tarefa CTA */}
        <button
          className="ml-2 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: '#6366F1' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6366F1')}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </button>
      </div>
    </header>
  );
}

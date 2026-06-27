import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  FolderOpen,
  FileBarChart,
  Settings,
  Menu,
  X,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agente', label: 'Agente', icon: MessageSquare },
  { path: '/tarefas', label: 'Tarefas', icon: ClipboardList },
  { path: '/arquivos', label: 'Arquivos', icon: FolderOpen },
  { path: '/relatorios', label: 'Relatorios', icon: FileBarChart },
  { path: '/configuracoes', label: 'Configuracoes', icon: Settings },
];

const sidebarVariants = {
  open: { width: 240, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
  collapsed: { width: 72, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<'online' | 'offline' | 'warning'>('online');
  const [aiModel] = useState('phi3:mini');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsCollapsed(false);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(true);
      }
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const statusConfig = {
    online: { color: '#10B981', label: 'Online', icon: Wifi },
    offline: { color: '#EF4444', label: 'Offline', icon: WifiOff },
    warning: { color: '#F59E0B', label: 'Lento', icon: AlertTriangle },
  };

  const currentStatus = statusConfig[aiStatus];
  const StatusIcon = currentStatus.icon;

  const sidebarContent = (
    <div className="flex h-full flex-col" style={{ backgroundColor: '#0F172A' }}>
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-3 px-4">
        <img src="/logo-icon.svg" alt="NEXUS AI" className="h-8 w-8 shrink-0" />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="whitespace-nowrap text-lg font-bold text-white"
            >
              NEXUS AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav className="mt-4 flex flex-1 flex-col gap-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive: navActive }) =>
                `group relative flex h-10 items-center gap-3 rounded-r-lg px-3 transition-all duration-150 ${
                  navActive
                    ? 'text-white'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                }`
              }
              style={isActive ? {
                backgroundColor: '#1E293B',
                borderLeft: '3px solid #6366F1',
              } : { borderLeft: '3px solid transparent' }}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* AI Status Card */}
      <div className="mx-3 mb-4 mt-auto">
        <div
          className="rounded-lg border p-4"
          style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: currentStatus.color }}
            />
            {!isCollapsed && (
              <span className="text-xs font-medium text-white">{currentStatus.label}</span>
            )}
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-2 text-xs" style={{ color: '#94A3B8' }}>
                Modelo: {aiModel}
              </p>
              <button
                onClick={() => setAiStatus(aiStatus === 'online' ? 'warning' : 'online')}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-white/10"
                style={{ color: '#94A3B8' }}
              >
                <StatusIcon size={12} />
                Verificar
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
        style={{ backgroundColor: '#0F172A', color: 'white' }}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="fixed left-0 top-0 z-40 h-screen w-60 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'open'}
        className="fixed left-0 top-0 z-20 hidden h-screen border-r lg:block"
        style={{ borderColor: '#334155' }}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}

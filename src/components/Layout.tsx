import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-[100dvh]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-[240px]">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

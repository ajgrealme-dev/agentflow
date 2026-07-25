'use client';

import { useSidebar } from './SidebarProvider';
import { useTheme } from './ThemeProvider';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import InteractiveTour from './InteractiveTour';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();
  const { theme } = useTheme();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isDark = theme === 'dark';

  return (
    <main
      className="flex-1 min-h-screen transition-all duration-300 ease-in-out"
      style={{
        marginLeft: isLoginPage ? '0px' : open ? '240px' : '64px',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-base text-secondary text-xs">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
          Memuat Halaman...
        </div>
      }>
        {children}
      </Suspense>
      <Suspense fallback={null}>
        <InteractiveTour />
      </Suspense>
    </main>
  );
}

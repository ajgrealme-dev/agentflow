'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface SidebarCtx {
  open: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarCtx>({ open: true, toggle: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('af-sidebar');
    if (stored !== null) setOpen(stored === 'true');
  }, []);

  const toggle = () => {
    setOpen(v => {
      const next = !v;
      localStorage.setItem('af-sidebar', String(next));
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);

import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/SidebarProvider';
import LayoutShell from '@/components/LayoutShell';
import AuthGuard from '@/components/AuthGuard';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgentFlow — AI Office Automation Platform',
  description: 'Platform otomasi perkantoran berbasis AI agent yang menggantikan pekerjaan input data manual 24/7',
  keywords: 'AI automation, office automation, data entry AI, agent workflow, Indonesia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} data-scroll-behavior="smooth">
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthGuard>
            <SidebarProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <LayoutShell>
                  {children}
                </LayoutShell>
              </div>
            </SidebarProvider>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}

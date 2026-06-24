'use client';

import Sidebar from '@/components/layout/Sidebar';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#16135e',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <Sidebar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          minWidth: 0,
        }}>
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}


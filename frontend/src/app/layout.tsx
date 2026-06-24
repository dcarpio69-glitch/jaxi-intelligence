import { LangProvider } from '@/store/language';
import { ProjectProvider } from '@/store/project';
import { AuthProvider } from '@/store/auth';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'JAXI Intelligence | BIMVDC CORE',
    template: '%s | JAXI Intelligence',
  },
  description: 'JAXI Intelligence — Outlook + Procore cross-analysis for JAXI Builders, Inc.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <LangProvider>
            <ProjectProvider>
              {children}
            </ProjectProvider>
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

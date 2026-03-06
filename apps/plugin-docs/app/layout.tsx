import './css/style.css';

import type { Metadata } from 'next';
import { Nothing_You_Could_Do } from 'next/font/google';
import localFont from 'next/font/local';
import Theme from './theme-provider';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloomframework.com';

const nycd = Nothing_You_Could_Do({
  subsets: ['latin'],
  variable: '--font-nycd',
  weight: '400',
  display: 'swap',
});

const aspekta = localFont({
  src: [
    { path: '../public/fonts/Aspekta-350.woff2', weight: '350' },
    { path: '../public/fonts/Aspekta-400.woff2', weight: '400' },
    { path: '../public/fonts/Aspekta-500.woff2', weight: '500' },
    { path: '../public/fonts/Aspekta-650.woff2', weight: '650' },
  ],
  variable: '--font-aspekta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Plugin Architecture Book — Web Loom',
    template: '%s — Plugin Architecture Book',
  },
  description:
    'A practical guide to building extensible systems with framework-agnostic plugin architecture in TypeScript.',
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${nycd.variable} ${aspekta.variable} font-aspekta antialiased text-slate-800 font-[350] bg-white dark:bg-slate-900 dark:text-slate-200`}
      >
        <Theme>{children}</Theme>
      </body>
    </html>
  );
}

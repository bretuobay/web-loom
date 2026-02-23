import './css/style.css';

import type { Metadata } from 'next';
import { Nothing_You_Could_Do } from 'next/font/google';
import localFont from 'next/font/local';
import Theme from './theme-provider';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloom.dev';

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
    default: 'Web Loom — Framework-Agnostic MVVM Architecture',
    template: '%s — Web Loom',
  },
  description:
    'Framework-agnostic MVVM architecture for the modern web. 34 packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.',
  keywords: [
    'MVVM',
    'TypeScript',
    'React',
    'Vue',
    'Angular',
    'framework-agnostic',
    'architecture',
    'ViewModel',
    'BaseModel',
    'signals',
    'reactive state',
    'design tokens',
    'headless UI',
    'Web Loom',
  ],
  authors: [{ name: 'Festus Yeboah' }],
  creator: 'Festus Yeboah',
  publisher: 'Web Loom',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Web Loom',
    title: 'Web Loom — Framework-Agnostic MVVM Architecture',
    description:
      'Framework-agnostic MVVM architecture for the modern web. 34 packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Web Loom — Framework-Agnostic MVVM Architecture',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Loom — Framework-Agnostic MVVM Architecture',
    description:
      'Framework-agnostic MVVM architecture for the modern web. 34 packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.',
    images: ['/opengraph-image'],
  },
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

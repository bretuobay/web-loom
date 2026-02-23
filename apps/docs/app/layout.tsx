import './css/style.css';

import { Nothing_You_Could_Do } from 'next/font/google';
import localFont from 'next/font/local';
import Theme from './theme-provider';

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

export const metadata = {
  title: 'Web Loom',
  description: 'Framework-agnostic MVVM architecture for the modern web. 34 packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.',
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

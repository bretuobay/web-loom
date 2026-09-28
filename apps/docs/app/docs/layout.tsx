import Header from '@/components/ui/header';
import AppProvider from '@/app/app-provider';

export default function DocsIndexLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex min-h-screen flex-col overflow-hidden bg-white dark:bg-slate-950">
        <Header />
        <main className="grow">
          <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6 md:pt-28">{children}</div>
        </main>
      </div>
    </AppProvider>
  );
}

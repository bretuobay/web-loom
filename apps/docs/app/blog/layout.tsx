import Header from '@/components/ui/header';
import AppProvider from '@/app/app-provider';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen overflow-hidden bg-white dark:bg-slate-950">
        <Header />
        <main className="grow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-16">
            {children}
          </div>
        </main>
      </div>
    </AppProvider>
  );
}

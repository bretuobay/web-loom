import Image from 'next/image';
import Illustration from '@/public/images/hero-illustration.svg';
import Header from '@/components/ui/header';
import Sidebar from '@/components/ui/sidebar';
import AppProvider from '@/app/app-provider';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen overflow-hidden">
        <Header />

        <main className="grow">
          <section className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none -z-10">
              <Image
                className="max-w-none"
                src={Illustration}
                priority
                alt="Page illustration"
                aria-hidden="true"
              />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div>
                <Sidebar />
                <div className="md:grow md:pl-64 lg:pr-6 xl:pr-0">
                  <div className="pt-20 md:pt-24 pb-8 md:pl-6 lg:pl-12">{children}</div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppProvider>
  );
}

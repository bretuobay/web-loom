import Image from 'next/image';
import Illustration from '@/public/images/hero-illustration.svg';
import Header from '@/components/ui/header';
import Sidebar from '@/components/ui/sidebar';
import AppProvider from '@/app/app-provider';
import { BrandLayoutShell } from '@repo/docs-theme';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <BrandLayoutShell
        header={<Header />}
        sidebar={<Sidebar />}
        illustration={
          <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none -z-10">
            <Image
              className="max-w-none"
              src={Illustration}
              priority
              alt="Page illustration"
              aria-hidden="true"
            />
          </div>
        }
      >
        {children}
      </BrandLayoutShell>
    </AppProvider>
  );
}

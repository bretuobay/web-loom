import type { BrandShellProps } from '../types';

export default function LayoutShell({
  header,
  children,
  sidebar,
  illustration,
  containerClassName = 'max-w-7xl mx-auto px-4 sm:px-6',
  contentWrapClassName = 'md:grow md:pl-64 lg:pr-6 xl:pr-0',
  contentInnerClassName = 'pt-20 md:pt-24 pb-8 md:pl-6 lg:pl-12',
  rootClassName = '',
}: BrandShellProps) {
  return (
    <div className={`flex flex-col min-h-screen overflow-hidden ${rootClassName}`.trim()}>
      {header}

      <main className="grow">
        <section className="relative">
          {illustration}
          <div className={containerClassName}>
            <div>
              {sidebar}
              <div className={contentWrapClassName}>
                <div className={contentInnerClassName}>{children}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

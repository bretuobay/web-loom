import { BrandFooter } from '@repo/docs-theme';
import Logo from './logo';

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? 'https://webloomframework.com';

export default function Footer() {
  return (
    <>
      <div className="mb-4 flex justify-center border-t border-slate-200 pt-6 dark:border-slate-800">
        <a
          href={DOCS_URL}
          className="text-sm text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Web Loom Framework Docs →
        </a>
      </div>
      <BrandFooter
        logo={<Logo />}
        copyrightOwner="Web Loom"
        githubHref="https://github.com/bretuobay/web-loom"
      />
    </>
  );
}

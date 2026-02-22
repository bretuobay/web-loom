import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link className="inline-flex items-center gap-2.5 mb-2 md:mb-0" href="/" aria-label="Web Loom">
      <Image src="/images/webloom.png" width={36} height={36} alt="Web Loom logo" />
      <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
        Web<span className="text-blue-500">.loom</span>
      </span>
    </Link>
  );
}

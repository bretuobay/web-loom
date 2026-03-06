import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  brandText?: string;
  accentText?: string;
  className?: string;
};

export default function BrandLogo({
  href = '/',
  imageSrc,
  imageAlt,
  imageWidth = 36,
  imageHeight = 36,
  brandText,
  accentText,
  className = '',
}: BrandLogoProps) {
  return (
    <Link className={`inline-flex items-center gap-2.5 ${className}`.trim()} href={href} aria-label={brandText ?? imageAlt}>
      <Image src={imageSrc} width={imageWidth} height={imageHeight} alt={imageAlt} />
      {brandText && (
        <span className="hidden sm:inline text-base font-semibold text-slate-800 dark:text-slate-100">
          {brandText}
          {accentText && <span className="text-blue-600 dark:text-blue-400">{accentText}</span>}
        </span>
      )}
    </Link>
  );
}

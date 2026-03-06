import { BrandThemeToggle } from '@repo/docs-theme';

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  return <BrandThemeToggle className={className} />;
}

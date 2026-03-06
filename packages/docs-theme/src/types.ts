export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  ariaLabel?: string;
};

export type SearchEntry = {
  title: string;
  summary: string;
  href: string;
  topic: string;
};

export type ChapterEntry = {
  slug: string;
  title: string;
  href: string;
  number?: number;
  section?: string;
};

export type BrandShellProps = {
  header: any;
  children: any;
  sidebar?: any;
  illustration?: any;
  containerClassName?: string;
  contentWrapClassName?: string;
  contentInnerClassName?: string;
  rootClassName?: string;
};

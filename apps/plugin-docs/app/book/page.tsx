import { redirect } from 'next/navigation';
import { getBookPages } from '@/components/mdx/utils';

export default function BookIndexPage() {
  const pages = getBookPages();
  const firstPage = pages[0];

  if (!firstPage) {
    redirect('/');
  }

  redirect(firstPage.href);
}

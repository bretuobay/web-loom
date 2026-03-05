import { redirect } from 'next/navigation';
import { getBookPages } from '@/components/mdx/utils';

export default function Home() {
  const firstPage = getBookPages()[0];
  redirect(firstPage?.href ?? '/book');
}

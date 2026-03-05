import { redirect } from 'next/navigation';

export default async function LegacyDocsCatchAllPage(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await props.params;
  const chapterSlug = slug[slug.length - 1];
  redirect(chapterSlug ? `/book/${chapterSlug}` : '/book');
}

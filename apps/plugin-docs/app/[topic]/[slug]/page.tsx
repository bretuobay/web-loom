import { redirect } from 'next/navigation';

export default async function LegacyTopicPage(props: {
  params: Promise<{
    topic: string;
    slug: string;
  }>;
}) {
  const { slug } = await props.params;
  redirect(`/book/${slug}`);
}

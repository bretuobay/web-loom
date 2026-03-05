import { redirect } from 'next/navigation';

export default async function LegacyTopicIndexPage() {
  redirect('/book');
}

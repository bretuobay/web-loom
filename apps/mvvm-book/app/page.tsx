import { BookReader } from "@/components/book-reader"
import { getChapters } from "@/lib/get-chapters"

export default async function Home() {
  const chapters = await getChapters()
  return <BookReader chapters={chapters} />
}

import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container mx-auto p-4">
      <p className="text-zinc-600">リポジトリが見つかりませんでした。</p>
      <Link
        href="/"
        className="mt-4 inline-block rounded text-zinc-500 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:outline-none"
      >
        ← トップへ戻る
      </Link>
    </section>
  );
}

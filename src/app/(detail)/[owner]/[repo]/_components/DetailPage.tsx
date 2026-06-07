import { Repo } from "@/app/_shared/github/domain";
import Image from "next/image";
import Link from "next/link";

type DetailPageProps = {
  repo: Repo;
  backHref?: string;
};

export function DetailPage({ repo, backHref = "/" }: DetailPageProps) {
  const { owner } = repo.fullName;
  const { stars, watchers, forks, issues } = repo.stats;

  return (
    <>
      <section className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">リポジトリ詳細</h2>
        <Link
          href={backHref}
          className="rounded text-zinc-600 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          ← トップへ戻る
        </Link>
      </section>

      <section className="rounded-lg border border-zinc-200 p-6">
        <div className="mb-6 flex items-center gap-4">
          <Image
            src={repo.owner.avatarUrl}
            alt={`${owner}のアバター`}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div>
            <p className="text-xl font-semibold break-all">{repo.fullName.value}</p>
            <p className="mt-1 text-zinc-500">
              Language: <span className="text-zinc-800">{repo.language ?? "-"}</span>
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          {(
            [
              { label: "Stars", value: stars },
              { label: "Watchers", value: watchers },
              { label: "Forks", value: forks },
              { label: "Issues", value: issues },
            ] as const
          ).map(({ label, value }) => (
            <div key={label} className="rounded border border-zinc-100 bg-zinc-50 p-4">
              <dt className="text-sm text-zinc-500">{label}</dt>
              <dd className="mt-1 text-lg font-semibold">{value.toLocaleString("ja-JP")}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

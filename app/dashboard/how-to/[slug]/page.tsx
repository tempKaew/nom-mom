import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, LightbulbIcon } from "@/components/icons";
import { BottomNav } from "@/components/common";
import { getHowToArticleBySlug } from "../content";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function HowToDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = getHowToArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="min-h-[100dvh] bg-app-bg">
      <header className="px-4 pt-5 pb-4 border-b border-green-100 bg-white/90 backdrop-blur">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/dashboard/how-to"
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"
            aria-label="Back to how-to list"
          >
            <ArrowLeftIcon size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <LightbulbIcon size={16} className="text-amber-500" />
            <h1 className="text-base font-bold text-gray-900">How to</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main
        className="px-4 py-4"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <article className="max-w-xl mx-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] text-amber-700 font-semibold">
            {article.category} • {article.readTime}
          </p>
          <h2 className="text-lg font-bold text-gray-900 mt-1.5 leading-snug">
            {article.title}
          </h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{article.summary}</p>

          <div className="mt-4 space-y-2.5">
            {article.content.map((line) => (
              <div key={line} className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                <p className="text-sm text-amber-900 leading-relaxed">• {line}</p>
              </div>
            ))}
          </div>
        </article>
      </main>

      <BottomNav />
    </div>
  );
}


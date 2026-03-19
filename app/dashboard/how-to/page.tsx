import Link from "next/link";
import { ArrowLeftIcon, ChevronRightIcon, LightbulbIcon } from "@/components/icons";
import { BottomNav } from "@/components/common";
import { HOW_TO_ARTICLES } from "./content";

export default function HowToListPage() {
  return (
    <div className="min-h-[100dvh] bg-app-bg">
      <header className="px-4 pt-5 pb-4 border-b border-green-100 bg-white/90 backdrop-blur">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"
            aria-label="Back to dashboard"
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
        <div className="max-w-xl mx-auto space-y-2.5">
          {HOW_TO_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/dashboard/how-to/${article.slug}`}
              className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-amber-700 font-semibold">
                    {article.category} • {article.readTime}
                  </p>
                  <h2 className="text-sm font-bold text-gray-800 mt-1 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
                <ChevronRightIcon size={14} className="text-gray-400 shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}


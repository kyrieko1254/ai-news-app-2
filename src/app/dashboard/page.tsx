import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { db } from "@/db";
import { newsArticles, categories } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import FetchButton from "./FetchButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { category: selectedCategoryId, page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const whereClause = selectedCategoryId
    ? eq(newsArticles.categoryId, selectedCategoryId)
    : undefined;

  // 카테고리 목록, 기사(페이지), 전체 기사 수를 병렬 조회
  const [categoryList, articles, [{ total }]] = await Promise.all([
    db.select().from(categories).orderBy(categories.name),
    db
      .select({
        id: newsArticles.id,
        translatedTitle: newsArticles.translatedTitle,
        originalTitle: newsArticles.originalTitle,
        summary: newsArticles.summary,
        source: newsArticles.source,
        originalUrl: newsArticles.originalUrl,
        publishedAt: newsArticles.publishedAt,
        fetchedAt: newsArticles.fetchedAt,
        categoryId: newsArticles.categoryId,
        categoryName: categories.name,
      })
      .from(newsArticles)
      .leftJoin(categories, eq(newsArticles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(newsArticles.fetchedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(newsArticles)
      .where(whereClause),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 페이지 링크 생성 헬퍼
  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (selectedCategoryId) params.set("category", selectedCategoryId);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/dashboard${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">AI 뉴스 수집기</h1>
          <div className="flex items-center gap-4">
            <FetchButton />
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 카테고리 바 */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <Link
            href="/dashboard"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategoryId
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            전체
          </Link>

          {categoryList.map((cat) => (
            <Link
              key={cat.id}
              href={`/dashboard?category=${cat.id}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {cat.name}
            </Link>
          ))}

          <Link
            href="/settings/categories"
            className="px-4 py-1.5 rounded-full text-sm font-medium border border-dashed border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 transition-colors flex items-center gap-1"
          >
            <span>+</span>
            <span>카테고리 추가</span>
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-zinc-400 text-sm mb-4">아직 수집된 뉴스가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 뉴스 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => {
                const date = article.publishedAt ?? article.fetchedAt;
                const dateStr = date.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <article
                    key={article.id}
                    className="bg-white rounded-xl border border-zinc-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow"
                  >
                    {/* 카테고리 배지 + 날짜 */}
                    <div className="flex items-center justify-between">
                      {article.categoryName ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                          {article.categoryName}
                        </span>
                      ) : (
                        <span />
                      )}
                      <time className="text-xs text-zinc-400">{dateStr}</time>
                    </div>

                    {/* 제목 */}
                    <h2 className="text-base font-semibold text-zinc-900 leading-snug line-clamp-2">
                      {article.translatedTitle ?? article.originalTitle}
                    </h2>

                    {/* 요약 */}
                    {article.summary && (
                      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    )}

                    {/* 출처 + 원문 링크 */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                      <span className="text-xs text-zinc-400 truncate max-w-[60%]">
                        {article.source}
                      </span>
                      <a
                        href={article.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        원문
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-10">
                {/* 이전 버튼 */}
                {currentPage > 1 ? (
                  <Link
                    href={pageHref(currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-200 transition-colors"
                  >
                    ←
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-sm text-zinc-300 cursor-not-allowed">←</span>
                )}

                {/* 페이지 번호 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={pageHref(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {page}
                  </Link>
                ))}

                {/* 다음 버튼 */}
                {currentPage < totalPages ? (
                  <Link
                    href={pageHref(currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-200 transition-colors"
                  >
                    →
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-sm text-zinc-300 cursor-not-allowed">→</span>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

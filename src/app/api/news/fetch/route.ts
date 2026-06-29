import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db'
import { newsArticles, categories } from '@/db/schema'
import { inArray } from 'drizzle-orm'

// 모듈 레벨 싱글턴
const parser = new Parser({ timeout: 10000 })
const anthropic = new Anthropic()

const RSS_SOURCES = [
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI' },
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge AI' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Technology Review' },
  { url: 'https://www.anthropic.com/news/rss.xml', name: 'Anthropic Blog' },
]

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

type Candidate = {
  url: string
  originalTitle: string
  pubDate: string | null
  sourceName: string
}

type EnrichedResult = {
  index: number
  translatedTitle: string | null
  summary: string | null
  categoryId: string | null
}

export async function POST() {
  // 인증 확인
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 카테고리 목록 조회 (Claude에게 UUID 전달용)
  const categoryList = await db.select().from(categories)
  const validCategoryIds = new Set(categoryList.map(c => c.id))

  // RSS 피드 병렬 수집 (소스별 독립 에러 처리)
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS
  const settled = await Promise.allSettled(
    RSS_SOURCES.map(async (source) => {
      const feed = await parser.parseURL(source.url)
      return feed.items
        .filter(item => {
          if (!item.link) return false
          if (!item.pubDate) return true
          return new Date(item.pubDate).getTime() >= cutoff
        })
        .map(item => ({
          url: item.link!,
          originalTitle: item.title?.trim() || '제목 없음',
          pubDate: item.pubDate ?? null,
          sourceName: source.name,
        }))
    })
  )

  // 성공한 피드의 기사 수집
  const candidates: Candidate[] = []
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      candidates.push(...result.value)
    } else {
      console.error(`[RSS 수집 실패] ${RSS_SOURCES[i].name}:`, result.reason)
    }
  })

  if (candidates.length === 0) {
    return NextResponse.json({ inserted: 0, message: '수집된 기사가 없습니다' })
  }

  // URL 중복 제거 (DB 대조)
  const candidateUrls = [...new Set(candidates.map(c => c.url))]
  const existing = await db
    .select({ url: newsArticles.originalUrl })
    .from(newsArticles)
    .where(inArray(newsArticles.originalUrl, candidateUrls))
  const existingSet = new Set(existing.map(r => r.url))
  const newArticles = candidates.filter(a => !existingSet.has(a.url))

  if (newArticles.length === 0) {
    return NextResponse.json({ inserted: 0, message: '새로운 기사가 없습니다' })
  }

  // Claude API 일괄 처리 (번역, 요약, 카테고리 분류)
  let enriched: EnrichedResult[] = []
  try {
    const systemPrompt = `당신은 AI 뉴스 큐레이터입니다. 영어 AI 뉴스 기사를 한국어로 번역하고 요약하며, 적절한 카테고리를 할당합니다. 반드시 JSON만 반환하세요.`

    const userMessage = `다음 AI 뉴스 기사들을 처리해 주세요.

카테고리 목록 (ID와 이름):
${JSON.stringify(categoryList.map(c => ({ id: c.id, name: c.name })), null, 2)}

기사 목록:
${JSON.stringify(newArticles.map((a, i) => ({
  index: i,
  originalTitle: a.originalTitle,
  source: a.sourceName,
})), null, 2)}

각 기사에 대해 아래 형식의 JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요:
[
  {
    "index": 0,
    "translatedTitle": "한국어 제목 (50자 이내)",
    "summary": "기사 핵심 내용을 한국어로 요약 (150자 이내)",
    "categoryId": "가장 적합한 카테고리 UUID 또는 null"
  }
]`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (textBlock && textBlock.type === 'text') {
      // Claude가 간혹 ```json 코드 블록으로 감쌀 수 있어 제거
      const cleaned = textBlock.text.replace(/^```json\n?|\n?```$/g, '').trim()
      enriched = JSON.parse(cleaned)
    }
  } catch (err) {
    // Claude 실패 시 원문 제목으로만 저장 (번역/요약 없이)
    console.error('[Claude API 오류]:', err)
    enriched = []
  }

  // DB 저장
  const enrichedMap = new Map(enriched.map(e => [e.index, e]))

  const insertValues = newArticles.map((article, i) => {
    const e = enrichedMap.get(i)
    // Claude가 잘못된 UUID를 반환할 수 있으므로 유효성 검사
    const categoryId = (e?.categoryId && validCategoryIds.has(e.categoryId))
      ? e.categoryId
      : null

    return {
      originalUrl: article.url,
      originalTitle: article.originalTitle,
      translatedTitle: e?.translatedTitle ?? null,
      summary: e?.summary ?? null,
      source: article.sourceName,
      publishedAt: article.pubDate ? new Date(article.pubDate) : null,
      categoryId,
    }
  })

  const inserted = await db
    .insert(newsArticles)
    .values(insertValues)
    .onConflictDoNothing()
    .returning({ id: newsArticles.id })

  return NextResponse.json({
    inserted: inserted.length,
    total: newArticles.length,
    message: `${inserted.length}개의 새 기사를 저장했습니다`,
  })
}

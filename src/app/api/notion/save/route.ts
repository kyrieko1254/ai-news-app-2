import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { db } from '@/db'
import { articles, categories, notionSaves } from '@/db/schema'
import { eq } from 'drizzle-orm'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const NOTION_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID!

export async function POST(request: Request) {
  // 인증 확인
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { articleId } = await request.json()
  if (!articleId) {
    return NextResponse.json({ error: 'articleId가 필요합니다' }, { status: 400 })
  }

  // 이미 저장된 기사인지 확인
  const [existingSave] = await db
    .select()
    .from(notionSaves)
    .where(eq(notionSaves.articleId, articleId))

  if (existingSave) {
    return NextResponse.json({ saved: true, notionPageId: existingSave.notionPageId })
  }

  // 기사 + 카테고리 조회
  const [article] = await db
    .select({
      id: articles.id,
      originalUrl: articles.originalUrl,
      originalTitle: articles.originalTitle,
      translatedTitle: articles.translatedTitle,
      summary: articles.summary,
      source: articles.source,
      publishedAt: articles.publishedAt,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.id, articleId))

  if (!article) {
    return NextResponse.json({ error: '기사를 찾을 수 없습니다' }, { status: 404 })
  }

  const title = article.translatedTitle ?? article.originalTitle
  const publishedDate = article.publishedAt ?? new Date()

  try {
    const page = await notion.pages.create({
      parent: { data_source_id: NOTION_DATA_SOURCE_ID },
      properties: {
        '제목': {
          title: [{ text: { content: title } }],
        },
        '출처': {
          url: article.originalUrl,
        },
        '카테고리': {
          select: { name: article.categoryName ?? '미분류' },
        },
        '요약': {
          rich_text: [
            {
              text: {
                content: `${article.summary ?? ''}\n\n원문 제목: ${article.originalTitle}\n출처: ${article.source}`,
              },
            },
          ],
        },
        '날짜': {
          date: { start: publishedDate.toISOString() },
        },
      },
    })

    await db.insert(notionSaves).values({
      articleId: article.id,
      notionPageId: page.id,
    })

    return NextResponse.json({ saved: true, notionPageId: page.id })
  } catch (err) {
    console.error('[Notion 저장 오류]:', err)
    return NextResponse.json({ error: 'Notion 저장에 실패했습니다' }, { status: 500 })
  }
}

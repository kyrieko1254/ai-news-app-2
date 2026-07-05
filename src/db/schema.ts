import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalUrl: varchar('original_url', { length: 2048 }).notNull().unique(),
  originalTitle: varchar('original_title', { length: 500 }).notNull(),
  translatedTitle: varchar('translated_title', { length: 500 }),
  summary: text('summary'),
  source: varchar('source', { length: 100 }).notNull(),
  publishedAt: timestamp('published_at'),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
})

export const notionSaves = pgTable('notion_saves', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  notionPageId: varchar('notion_page_id', { length: 255 }).notNull(),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
})

# AI 뉴스 콜렉터 — PRD (Product Requirements Document)

## 1. 개요

해외 AI 뉴스를 RSS로 수집하고, Claude AI가 한국어로 번역·요약·카테고리 분류하여 카드 형태로 보여주는 웹 앱. 관심 있는 뉴스는 Notion에 저장할 수 있다.

---

## 2. 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 인증 | Clerk (이메일/비밀번호, Google OAuth, GitHub OAuth) |
| 데이터베이스 | Neon (PostgreSQL) + Drizzle ORM |
| AI 번역/요약/분류 | Claude API (claude-sonnet-4-6) |
| 노션 저장 | Notion MCP 서버 |
| 스타일링 | Tailwind CSS |

---

## 3. 뉴스 수집 소스

| 사이트 | RSS URL |
|--------|---------|
| TechCrunch AI | https://techcrunch.com/category/artificial-intelligence/feed/ |
| The Verge Tech | https://www.theverge.com/tech/rss/index.xml |
| VentureBeat AI | https://venturebeat.com/category/ai/feed/ |

---

## 4. 기능 요구사항

### 4.1 인증

- Clerk을 통한 로그인/회원가입
- 지원 방식: 이메일+비밀번호, Google, GitHub
- 비로그인 상태에서는 앱 진입 불가 (로그인 페이지로 리다이렉트)

### 4.2 뉴스 수집

- 대시보드의 `뉴스 가져오기` 버튼 클릭 시에만 수집 (자동 수집 없음)
- 3개 RSS 피드를 동시에 요청하여 최신 기사 수집
- 이미 DB에 저장된 기사는 중복 저장하지 않음 (원문 URL 기준 중복 체크)
- 수집 중에는 로딩 상태 표시

### 4.3 AI 처리 (Claude API)

수집된 기사마다 Claude API를 호출하여 아래 작업을 한 번의 요청으로 처리:

- **번역**: 기사 제목을 한국어로 번역
- **요약**: 기사 본문을 한국어로 3~5줄 요약
- **카테고리 분류**: 기사를 기존 카테고리 중 하나로 자동 분류

### 4.4 카테고리

**기본 카테고리 (초기값)**

| 카테고리 | 설명 |
|----------|------|
| AI 모델 | 새로운 AI 모델 출시, 벤치마크, 성능 비교 |
| AI 서비스/제품 | AI 기반 서비스 및 제품 소식 |
| 빅테크 | Google, Microsoft, Apple, Meta, Amazon 등 주요 기업 동향 |
| 정책/규제 | AI 관련 법률, 규제, 정부 정책 |
| 연구/논문 | AI 연구 논문, 학술 성과 |

- 카테고리는 DB에서 관리하며 추가·수정·삭제 가능
- 카테고리 삭제 시, 해당 카테고리로 분류된 기사는 `미분류`로 처리

### 4.5 뉴스 카드 UI

각 뉴스 카드에 표시되는 정보:

- 한국어 번역 제목
- 한국어 요약 (3~5줄)
- 출처 사이트명 + 발행일
- 카테고리 배지
- `원문 보기` 버튼 (새 탭으로 원문 링크 오픈)
- `Notion 저장` 버튼

### 4.6 카테고리 필터

- 대시보드 상단에 카테고리 탭 표시
- `전체` 탭 포함, 탭 클릭 시 해당 카테고리 뉴스만 표시
- 카테고리 관리(추가/수정/삭제)는 별도 설정 페이지에서 처리

### 4.7 Notion 저장

- 뉴스 카드의 `Notion 저장` 버튼 클릭 시 Notion MCP 서버를 통해 처리
- 저장 형태: 뉴스 1건당 Notion 페이지 1개 생성
- 저장되는 내용:
  - 한국어 제목
  - 원문 제목
  - 출처 + 발행일
  - 한국어 요약
  - 원문 링크
  - 카테고리
- 이미 저장된 기사는 버튼 상태로 표시 (재저장 방지 또는 허용 여부는 추후 결정)

---

## 5. 데이터베이스 스키마

### `categories`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | varchar | 카테고리명 |
| description | text | 설명 (선택) |
| created_at | timestamp | 생성일 |

### `news_articles`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| original_url | varchar | 원문 URL (unique) |
| original_title | varchar | 원문 제목 |
| translated_title | varchar | 한국어 번역 제목 |
| summary | text | 한국어 요약 |
| source | varchar | 출처 사이트명 |
| published_at | timestamp | 원문 발행일 |
| category_id | uuid | FK → categories.id |
| fetched_at | timestamp | 수집일 |

### `notion_saves`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| article_id | uuid | FK → news_articles.id |
| notion_page_id | varchar | 생성된 Notion 페이지 ID |
| saved_at | timestamp | 저장일 |

---

## 6. 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 루트 → 로그인 상태면 `/dashboard`로, 아니면 `/sign-in`으로 리다이렉트 |
| `/sign-in` | Clerk 로그인 페이지 |
| `/sign-up` | Clerk 회원가입 페이지 |
| `/dashboard` | 메인 대시보드 — 뉴스 카드 목록, 카테고리 필터, 뉴스 가져오기 버튼 |
| `/settings/categories` | 카테고리 관리 페이지 (추가/수정/삭제) |

---

## 7. API 라우트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/news/fetch` | RSS 수집 → Claude 처리 → DB 저장 |
| GET | `/api/news` | 뉴스 목록 조회 (카테고리 필터 지원) |
| GET | `/api/categories` | 카테고리 목록 조회 |
| POST | `/api/categories` | 카테고리 추가 |
| PUT | `/api/categories/[id]` | 카테고리 수정 |
| DELETE | `/api/categories/[id]` | 카테고리 삭제 |
| POST | `/api/notion/save` | Notion에 뉴스 저장 |

---

## 8. 미결 사항

- [ ] Notion MCP 서버 연결 대상 워크스페이스 및 저장 위치(데이터베이스 또는 페이지) 확정
- [ ] 이미 Notion에 저장된 기사의 `Notion 저장` 버튼 처리 방식 (비활성화 vs 재저장 허용)
- [ ] RSS에서 본문 전체를 가져올 수 없는 경우의 요약 처리 방식 (description 필드 사용)
- [ ] 카테고리 관리 권한 — 현재는 로그인한 모든 사용자가 관리 가능, 추후 관리자 역할 도입 여부

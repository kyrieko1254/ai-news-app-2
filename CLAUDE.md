# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 주의: Next.js 버전

이 프로젝트는 Next.js 16 (App Router)을 사용합니다. 학습 데이터의 Next.js와 API, 컨벤션, 파일 구조가 다를 수 있습니다. 코드 작성 전 `node_modules/next/dist/docs/`의 가이드를 확인하세요.

## UI 가이드

UI 컴포넌트 작성 시 `ui.md`를 참조하세요. 색상 시스템, 컴포넌트 구조, 타이포그래피, 간격, 반응형 원칙이 정의되어 있습니다.

## 코딩 스타일

- 변수 이름: 카멜 케이스
- 들여쓰기: 2칸
- 주석: 한글로 작성

## 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 실행

npm run db:push      # DB 스키마를 Neon에 바로 반영 (개발용)
npm run db:generate  # 마이그레이션 파일 생성
npm run db:migrate   # 마이그레이션 실행
npm run db:studio    # Drizzle Studio (DB GUI) 실행
```

## 아키텍처

### 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 인증 | Clerk |
| DB | Neon (PostgreSQL) + Drizzle ORM |
| AI | Claude API (`claude-sonnet-4-6`) |
| 노션 저장 | Notion MCP 서버 |
| 스타일링 | Tailwind CSS v4 |

### 디렉토리 구조

```
src/
  app/                   # Next.js App Router 페이지
    (auth)/              # Clerk 인증 페이지 그룹
      sign-in/
      sign-up/
    dashboard/           # 메인 대시보드
    settings/
      categories/        # 카테고리 관리
    api/                 # API 라우트
      news/
        fetch/           # POST: RSS 수집 → Claude 처리 → DB 저장
        route.ts         # GET: 뉴스 목록 조회
      categories/
        [id]/            # PUT, DELETE: 카테고리 수정/삭제
        route.ts         # GET, POST: 카테고리 목록/추가
      notion/
        save/            # POST: Notion에 뉴스 저장
  db/
    schema.ts            # Drizzle 테이블 정의
    index.ts             # Neon DB 연결 (drizzle 인스턴스 export)
```

### 데이터 흐름

1. **뉴스 수집**: `POST /api/news/fetch` → 3개 RSS 피드 병렬 요청 → 중복 URL 체크 → Claude API로 번역·요약·카테고리 분류 → DB 저장
2. **뉴스 조회**: `GET /api/news?category=<id>` → DB에서 카테고리 필터 조회
3. **Notion 저장**: `POST /api/notion/save` → Notion MCP 서버를 통해 페이지 생성 → `notion_saves` 테이블에 기록

### DB 스키마 관계

- `articles.category_id` → `categories.id` (카테고리 삭제 시 `null`로 설정)
- `notion_saves.article_id` → `articles.id` (기사 삭제 시 cascade)

### 인증

루트(`/`)는 로그인 상태에 따라 `/dashboard` 또는 `/sign-in`으로 리다이렉트합니다. 모든 대시보드·API 라우트는 Clerk 미들웨어로 보호됩니다.

### 환경변수

`.env.local`에 아래 값을 설정해야 합니다:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL          # Neon 연결 문자열
ANTHROPIC_API_KEY
```

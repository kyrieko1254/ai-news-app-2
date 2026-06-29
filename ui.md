# AI 뉴스 수집기 — UI 가이드

## 개요

**앱 이름:** AI 뉴스 수집기  
**프레임워크:** Next.js 16 (App Router)  
**스타일링:** Tailwind CSS v4  
**폰트:** Geist Sans (본문), Geist Mono (코드)  
**언어:** 한국어 (`lang="ko"`)

---

## 색상 시스템

Tailwind의 `zinc` 팔레트를 기본으로 사용합니다.

| 역할 | 클래스 | 색상 |
|------|--------|------|
| 페이지 배경 | `bg-zinc-50` | 연한 회색 |
| 카드·패널 배경 | `bg-white` | 흰색 |
| 구분선 | `border-zinc-200` | 밝은 회색 |
| 제목 텍스트 | `text-zinc-900` | 거의 검정 |
| 보조 텍스트 | `text-zinc-500` | 중간 회색 |
| 강조 (버튼·링크) | `bg-zinc-900` `text-white` | 다크 |
| 강조 호버 | `hover:bg-zinc-700` | 약간 밝은 다크 |

> CSS 변수(`--background`, `--foreground`)는 다크 모드 자동 전환에 사용되며, 컴포넌트 레벨에서는 Tailwind 유틸리티 클래스를 직접 사용합니다.

---

## 레이아웃

### 전체 페이지 구조

```
<html>
  <body class="min-h-screen flex flex-col bg-zinc-50">
    <Header />          ← 상단 고정 헤더
    <main class="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
      <CategoryBar />   ← 카테고리 필터 바
      <NewsGrid />      ← 뉴스 카드 목록
    </main>
  </body>
</html>
```

### 콘텐츠 최대 너비

```
max-w-4xl mx-auto px-6
```

모든 콘텐츠는 `max-w-4xl`(896px) 안에서 좌우 패딩 `px-6`(24px)을 유지합니다.

---

## 컴포넌트

### 1. 헤더 (`Header`)

상단 고정 바. 앱 이름과 사용자 버튼을 포함합니다.

```html
<header class="bg-white border-b border-zinc-200">
  <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
    <span class="text-xl font-semibold text-zinc-900">AI 뉴스 수집기</span>
    <UserButton />   <!-- Clerk 제공 -->
  </div>
</header>
```

---

### 2. 카테고리 바 (`CategoryBar`)

뉴스 카드 목록 위에 위치. 카테고리 필터 버튼들과 카테고리 추가 버튼을 가로로 나열합니다.

```html
<div class="flex items-center gap-2 flex-wrap mb-6">

  <!-- 카테고리 버튼 (비활성) -->
  <button class="px-4 py-1.5 rounded-full text-sm font-medium
                 bg-white border border-zinc-200
                 text-zinc-600 hover:bg-zinc-50 transition-colors">
    전체
  </button>

  <!-- 카테고리 버튼 (활성) -->
  <button class="px-4 py-1.5 rounded-full text-sm font-medium
                 bg-zinc-900 text-white">
    AI
  </button>

  <!-- 카테고리 추가 버튼 (목록 끝) -->
  <button class="px-4 py-1.5 rounded-full text-sm font-medium
                 border border-dashed border-zinc-300
                 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400
                 transition-colors flex items-center gap-1">
    <span>+</span>
    <span>카테고리 추가</span>
  </button>

</div>
```

**규칙:**
- 활성 카테고리: `bg-zinc-900 text-white` (채워진 pill)
- 비활성 카테고리: `bg-white border border-zinc-200 text-zinc-600` (테두리 pill)
- 추가 버튼: 점선 테두리(`border-dashed`), 목록 맨 끝에 위치

---

### 3. 뉴스 카드 (`NewsCard`)

뉴스 한 건을 표시하는 카드 컴포넌트입니다.

```html
<article class="bg-white rounded-xl border border-zinc-200
                p-5 flex flex-col gap-3
                hover:shadow-sm transition-shadow">

  <!-- 상단: 카테고리 배지 + 날짜 -->
  <div class="flex items-center justify-between">
    <span class="text-xs font-medium px-2 py-0.5 rounded-full
                 bg-zinc-100 text-zinc-600">
      AI
    </span>
    <time class="text-xs text-zinc-400">2026. 6. 28.</time>
  </div>

  <!-- 제목 -->
  <h2 class="text-base font-semibold text-zinc-900 leading-snug line-clamp-2">
    Claude 4, 새로운 추론 벤치마크 달성
  </h2>

  <!-- 요약 -->
  <p class="text-sm text-zinc-500 leading-relaxed line-clamp-3">
    Anthropic이 공개한 Claude 4는 기존 모델 대비 추론 능력이
    크게 향상되었으며...
  </p>

  <!-- 하단: 출처 + 액션 버튼 -->
  <div class="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
    <span class="text-xs text-zinc-400 truncate max-w-[60%]">
      techcrunch.com
    </span>
    <div class="flex items-center gap-2">
      <!-- 원문 보기 -->
      <a href="#" target="_blank"
         class="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
        원문
      </a>
      <!-- Notion 저장 -->
      <button class="text-xs px-2.5 py-1 rounded-lg
                     bg-zinc-900 text-white
                     hover:bg-zinc-700 transition-colors">
        저장
      </button>
    </div>
  </div>

</article>
```

---

### 4. 뉴스 카드 그리드 (`NewsGrid`)

카드들을 반응형 그리드로 배치합니다.

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <NewsCard />
  <NewsCard />
  ...
</div>
```

| 화면 너비 | 열 수 |
|-----------|-------|
| ~640px (모바일) | 1열 |
| 640px~ (태블릿) | 2열 |
| 1024px~ (데스크톱) | 3열 |

---

### 5. 빈 상태 (`EmptyState`)

뉴스가 없을 때 표시합니다.

```html
<div class="flex flex-col items-center justify-center py-24 text-center">
  <p class="text-zinc-400 text-sm mb-4">아직 수집된 뉴스가 없습니다.</p>
  <button class="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm
                 hover:bg-zinc-700 transition-colors">
    뉴스 수집하기
  </button>
</div>
```

---

### 6. 뉴스 수집 버튼

헤더 또는 페이지 상단에서 수동으로 뉴스 수집을 트리거합니다.

```html
<button class="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium
               hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  뉴스 수집
</button>
```

로딩 중에는 `disabled` 상태로 표시합니다.

---

## 타이포그래피

| 용도 | 클래스 |
|------|--------|
| 앱 타이틀 | `text-xl font-semibold text-zinc-900` |
| 카드 제목 | `text-base font-semibold text-zinc-900 leading-snug` |
| 본문·요약 | `text-sm text-zinc-500 leading-relaxed` |
| 배지·라벨 | `text-xs font-medium` |
| 보조 정보 | `text-xs text-zinc-400` |

---

## 간격 기준

| 역할 | 값 |
|------|----|
| 페이지 좌우 패딩 | `px-6` (24px) |
| 페이지 상하 패딩 | `py-8` (32px) |
| 카드 내부 패딩 | `p-5` (20px) |
| 카드 그리드 간격 | `gap-4` (16px) |
| 카테고리 버튼 간격 | `gap-2` (8px) |
| 카테고리 바 하단 여백 | `mb-6` (24px) |

---

## 반응형 원칙

- **모바일 퍼스트:** 기본값은 1열, 너비가 넓어질수록 열 수 증가
- **최대 너비:** `max-w-4xl`로 콘텐츠 폭 제한, 넓은 화면에서도 가독성 유지
- **카테고리 바:** `flex-wrap`으로 좁은 화면에서 줄바꿈 허용

---

## 인터랙션

| 요소 | 인터랙션 |
|------|----------|
| 카드 | `hover:shadow-sm transition-shadow` |
| 버튼 (다크) | `hover:bg-zinc-700 transition-colors` |
| 카테고리 버튼 (비활성) | `hover:bg-zinc-50 transition-colors` |
| 카테고리 추가 버튼 | `hover:text-zinc-600 hover:border-zinc-400 transition-colors` |
| 원문 링크 | `hover:text-zinc-900 transition-colors` |

모든 전환은 `transition-colors` 또는 `transition-shadow`를 사용합니다.

import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">AI 뉴스 수집기</h1>
        <UserButton />
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-zinc-600">대시보드 준비 중입니다.</p>
      </main>
    </div>
  );
}

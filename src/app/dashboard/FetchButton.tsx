"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FetchButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/news/fetch', { method: 'POST' })
      const data = await res.json()
      setMessage(data.message ?? '완료')
      // 서버 컴포넌트 데이터 갱신
      router.refresh()
    } catch {
      setMessage('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-1.5 rounded-full text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '가져오는 중...' : '뉴스 가져오기'}
      </button>
      {message && (
        <span className="text-xs text-zinc-500">{message}</span>
      )}
    </div>
  )
}

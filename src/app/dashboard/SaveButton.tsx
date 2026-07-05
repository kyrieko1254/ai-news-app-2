"use client"

import { useState } from 'react'

interface Props {
  articleId: string
  initiallySaved: boolean
}

export default function SaveButton({ articleId, initiallySaved }: Props) {
  const [saved, setSaved] = useState(initiallySaved)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (saved || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/notion/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      })
      if (res.ok) {
        setSaved(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={saved || loading}
      className={`text-xs font-medium transition-colors ${
        saved
          ? 'text-emerald-600 cursor-default'
          : 'text-zinc-500 hover:text-zinc-900'
      } disabled:opacity-70`}
    >
      {saved ? '저장됨' : loading ? '저장 중...' : '뉴스 저장'}
    </button>
  )
}

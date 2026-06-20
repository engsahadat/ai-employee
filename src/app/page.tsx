'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'
import { LogoIcon } from '@/components/Logo'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading…</div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden bg-[#070710]">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <LogoIcon size={80} className="drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
          AI Employee Platform
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Intelligent AI-powered workforce management
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-xs sm:max-w-none mx-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto text-center px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 hover:scale-[1.01]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto text-center px-8 py-3.5 border border-[#2e2b54] hover:bg-[#201e3d]/30 rounded-xl font-semibold text-gray-300 hover:text-white transition-all hover:scale-[1.01]"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  )
}

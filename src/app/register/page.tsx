'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'
import { register as apiRegister } from '@/lib/api'
import { LogoIcon } from '@/components/Logo'

// Google Client ID — replace with your own from Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'

export default function RegisterPage() {
  const router = useRouter()
  const { register, loginWithGoogle, user, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)

  // Redirect if already logged in.
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  // Load Google Sign-In script.
  useEffect(() => {
    if (typeof window === 'undefined') return

    let active = true
    let timeoutId: any = null
    let pollIntervalId: any = null

    const initializeGoogle = () => {
      if (!active) return
      const google = (window as any).google
      if (google?.accounts?.id) {
        // Clear polling if any
        if (pollIntervalId) {
          clearInterval(pollIntervalId)
          pollIntervalId = null
        }

        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
          })
        } catch (e) {
          console.error('Google accounts initialize error:', e)
        }
        
        const render = () => {
          if (!active) return
          const targetBtn = document.getElementById('google-signup-btn')
          if (targetBtn) {
            // Check if already has children to prevent duplicate buttons
            if (targetBtn.children.length === 0) {
              try {
                google.accounts.id.renderButton(
                  targetBtn,
                  {
                    theme: 'filled_black',
                    size: 'large',
                    width: '100%',
                    text: 'signup_with',
                    shape: 'pill',
                  }
                )
              } catch (e) {
                console.error('Google renderButton error:', e)
              }
            }
            setGoogleLoaded(true)
          } else {
            timeoutId = setTimeout(render, 50)
          }
        }
        render()
      }
    }

    const scriptId = 'google-gsi'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null

    if (script) {
      const google = (window as any).google
      if (google?.accounts?.id) {
        initializeGoogle()
      } else {
        // Script exists but google is not defined yet (still loading or loaded but initializing)
        script.addEventListener('load', initializeGoogle)
        // Polling fallback to be absolutely sure
        pollIntervalId = setInterval(() => {
          const google = (window as any).google
          if (google?.accounts?.id) {
            initializeGoogle()
          }
        }, 100)
      }
    } else {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client?hl=en'
      script.async = true
      script.defer = true
      script.onload = initializeGoogle
      document.head.appendChild(script)
      
      // Polling fallback to be absolutely sure
      pollIntervalId = setInterval(() => {
        const google = (window as any).google
        if (google?.accounts?.id) {
          initializeGoogle()
        }
      }, 100)
    }

    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
      if (pollIntervalId) clearInterval(pollIntervalId)
      if (script) {
        script.removeEventListener('load', initializeGoogle)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGoogleCallback = async (response: any) => {
    try {
      setError('')
      setSubmitting(true)
      await loginWithGoogle(response.credential)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await apiRegister(name, email, password)
      router.push(`/verify-email-pending?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#070710]">
      {/* Animated background orbs */}
      <div className="reg-orb reg-orb-1" />
      <div className="reg-orb reg-orb-2" />
      <div className="reg-orb reg-orb-3" />

      <div className="reg-card w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoIcon size={56} className="drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Join the AI Employee Platform</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Google Sign-Up */}
        <div className="mb-6">
          <div id="google-signup-btn" className="flex justify-center" />
          {!googleLoaded && (
            <button
              type="button"
              onClick={() => {
                ;(window as any).google?.accounts?.id?.prompt()
              }}
              className="w-full mt-2 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm text-gray-300 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 focus:bg-white/10 transition-all"
            />
            <p className="text-xs text-gray-600 mt-1">At least 6 characters</p>
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 focus:bg-white/10 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-600/25 hover:scale-[1.01]"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <style jsx>{`
        .reg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          pointer-events: none;
        }
        .reg-orb-1 {
          width: 400px; height: 400px;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          top: -15%; right: -10%;
          animation: float1 8s ease-in-out infinite;
        }
        .reg-orb-2 {
          width: 300px; height: 300px;
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          bottom: -10%; left: -10%;
          animation: float2 10s ease-in-out infinite;
        }
        .reg-orb-3 {
          width: 200px; height: 200px;
          background: linear-gradient(135deg, #db2777, #7c3aed);
          top: 40%; left: 15%;
          animation: float3 6s ease-in-out infinite;
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -30px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 15px); }
        }
        .reg-card {
          background: rgba(15, 15, 30, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
        }
        @media (min-width: 640px) {
          .reg-card {
            padding: 40px;
          }
        }
      `}</style>
    </div>
  )
}

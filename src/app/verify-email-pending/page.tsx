'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { resendVerification } from '@/lib/api'
import { useAuth } from '@/components/AuthContext'

function VerifyEmailPendingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout } = useAuth()
  const email = searchParams.get('email') || ''
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!email) {
      setError('Email address not found. Please try logging in or registering again.')
      return
    }
    setError('')
    setSuccess('')
    setResending(true)
    try {
      await resendVerification(email)
      setSuccess('A new verification link has been sent to your email address.')
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification link.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="login-card w-full max-w-md relative z-10">
      {/* Icon */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-violet-500/25">
          ✉️
        </div>
        <h1 className="text-2xl font-bold text-white">Verify your email</h1>
        <p className="text-gray-400 text-sm mt-2">
          We've sent a verification link to:
        </p>
        <p className="text-violet-400 font-medium text-sm mt-1 break-all">{email || 'your email address'}</p>
      </div>

      {success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <p className="text-gray-400 text-xs text-center leading-relaxed mb-6">
        Please check your inbox (and spam folder) and click the link to activate your account.
      </p>

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-600/20 text-white hover:scale-[1.01]"
      >
        {resending ? 'Sending link…' : 'Resend Verification Link'}
      </button>

      <div className="text-center mt-6">
        <button 
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors bg-transparent border-none cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )
}

export default function VerifyEmailPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#070710]">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <Suspense fallback={<div className="animate-pulse text-gray-400 text-lg">Loading…</div>}>
        <VerifyEmailPendingContent />
      </Suspense>

      <style jsx>{`
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          pointer-events: none;
        }
        .login-orb-1 {
          width: 400px; height: 400px;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          top: -15%; left: -10%;
          animation: float1 8s ease-in-out infinite;
        }
        .login-orb-2 {
          width: 300px; height: 300px;
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          bottom: -10%; right: -10%;
          animation: float2 10s ease-in-out infinite;
        }
        .login-orb-3 {
          width: 200px; height: 200px;
          background: linear-gradient(135deg, #db2777, #7c3aed);
          top: 50%; right: 20%;
          animation: float3 6s ease-in-out infinite;
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -30px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, -15px); }
        }
        .login-card {
          background: rgba(15, 15, 30, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
        }
        @media (min-width: 640px) {
          .login-card {
            padding: 40px;
          }
        }
      `}</style>
    </div>
  )
}

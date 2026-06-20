'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail } from '@/lib/api'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token.')
      setVerifying(false)
      return
    }

    const runVerification = async () => {
      try {
        await verifyEmail(token)
        setSuccess(true)
      } catch (err: any) {
        setError(err.message || 'Verification failed. The link may have expired or is invalid.')
      } finally {
        setVerifying(false)
      }
    }

    runVerification()
  }, [token])

  return (
    <div className="login-card w-full max-w-md relative z-10 text-center">
      {verifying && (
        <div className="p-4">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Verifying your email</h1>
          <p className="text-gray-400 text-sm">Please wait while we verify your account...</p>
        </div>
      )}

      {!verifying && success && (
        <div className="p-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-3xl text-green-400 mx-auto mb-6 shadow-lg shadow-green-500/10">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Your email address has been verified successfully. You can now sign in to your account.
          </p>
          <Link
            href="/login"
            className="block w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-600/20 text-white text-center hover:scale-[1.01]"
          >
            Sign In
          </Link>
        </div>
      )}

      {!verifying && error && (
        <div className="p-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl text-red-400 mx-auto mb-6 shadow-lg shadow-red-500/10">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
          <p className="text-red-400/90 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 break-all">
            {error}
          </p>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            The verification token may be invalid or has expired.
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full py-3 bg-white/5 border border-[#2e2b54] hover:bg-[#201e3d]/30 text-gray-300 hover:text-white rounded-xl font-semibold text-sm transition-all text-white text-center hover:scale-[1.01]"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#070710]">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <Suspense fallback={<div className="animate-pulse text-gray-400 text-lg">Loading…</div>}>
        <VerifyEmailContent />
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

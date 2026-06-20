'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User,
  getMe,
  login as apiLogin,
  register as apiRegister,
  loginWithGoogle as apiGoogleLogin,
  logout as apiLogout,
  getToken,
} from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, check if we have a saved token.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => {
        apiLogout()
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    setUser(res.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await apiRegister(name, email, password)
    setUser(res.user)
  }

  const loginWithGoogle = async (idToken: string) => {
    const res = await apiGoogleLogin(idToken)
    setUser(res.user)
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { sendChatMessage, getChatSessions, getChatSessionHistory, deleteChatSession, ChatSession, ChatMessage } from '@/lib/api'
import Logo from '@/components/Logo'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

// Helper function to parse markdown images ![alt](url) and return JSX
function parseMessageContent(content: string) {
  if (!content) return null

  // Regex to match markdown images: ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index)
    const altText = match[1]
    const imageUrl = match[2]

    if (textBefore) {
      parts.push(<span key={`text-${lastIndex}`}>{textBefore}</span>)
    }

    parts.push(
      <div key={`img-${match.index}`} className="my-3 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-[#0e0f1e] max-w-lg">
        <img
          src={imageUrl}
          alt={altText || 'AI Generated Image'}
          className="w-full h-auto object-cover max-h-[450px] transition-all duration-300 hover:scale-[1.01] cursor-pointer"
          loading="lazy"
          onClick={() => window.open(imageUrl, '_blank')}
        />
      </div>
    )

    lastIndex = imageRegex.lastIndex
  }

  const textAfter = content.substring(lastIndex)
  if (textAfter) {
    parts.push(<span key={`text-${lastIndex}`}>{textAfter}</span>)
  }

  return parts.length > 0 ? parts : content
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<{ role: string; content: string; file?: { name: string; type: string; url: string } }[]>([])
  const [sending, setSending] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; base64: string; previewUrl: string } | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  // Chat History Sidebar states
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, sending])

  // Redirect if not authenticated or unverified.
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (!user.is_verified) {
        router.replace(`/verify-email-pending?email=${encodeURIComponent(user.email)}`)
      }
    }
  }, [user, loading, router])

  // Fetch session list
  const loadSessionsList = async () => {
    try {
      const list = await getChatSessions()
      setSessions(list || [])
      return list || []
    } catch (err) {
      console.error('Failed to load chat history sessions:', err)
      return []
    }
  }

  // Load a session's messages
  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_session_id', sessionId)
    }
    setSending(false)
    setSidebarOpen(false)
    try {
      const history = await getChatSessionHistory(sessionId)
      const formatted = (history || []).map((m) => ({
        role: m.role,
        content: m.content,
        file: m.file ? {
          name: m.file.name,
          type: m.file.type,
          url: m.file.url
        } : undefined
      }))
      setChat(formatted)
    } catch (err) {
      console.error('Failed to load session messages:', err)
    }
  }

  // Clear current active session & chat logs
  const startNewChat = () => {
    setActiveSessionId(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_session_id')
    }
    setChat([])
    setAttachedFile(null)
    setMessage('')
    setSidebarOpen(false)
  }

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId)
      if (activeSessionId === sessionId) {
        startNewChat()
      }
      loadSessionsList()
    } catch (err) {
      console.error('Failed to delete chat session:', err)
    }
  }

  // Load sessions list and restore active session on component mount / user change
  useEffect(() => {
    if (user) {
      loadSessionsList().then((list) => {
        if (typeof window !== 'undefined') {
          const savedSessionId = localStorage.getItem('active_session_id')
          if (savedSessionId && list.some((s: any) => s.session_id === savedSessionId)) {
            loadSession(savedSessionId)
          } else if (savedSessionId) {
            // Clear invalid session ID from local storage
            localStorage.removeItem('active_session_id')
          }
        }
      })
    }
  }, [user])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recog = new SpeechRecognition()
        recog.continuous = true
        recog.interimResults = false
        recog.lang = 'en-US'

        recog.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript
          setMessage((prev) => prev + (prev ? ' ' : '') + transcript.trim())
        }

        recog.onerror = (event: any) => {
          setIsListening(false)
          if (event.error === 'not-allowed') {
            alert('Microphone access is blocked. Please click the camera/microphone icon in your browser address bar (or go to site settings) and allow microphone access to use voice typing.')
          } else {
            console.warn('Speech recognition warning:', event.error)
          }
        }

        recog.onend = () => {
          setIsListening(false)
        }

        setRecognition(recog)
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      try {
        recognition.start()
        setIsListening(true)
      } catch (err) {
        console.error('Failed to start speech recognition:', err)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Extract the raw base64 data portion (omit the "data:*/*;base64," prefix)
      const base64Data = result.split(',')[1]
      
      setAttachedFile({
        name: file.name,
        type: file.type,
        base64: base64Data,
        previewUrl: URL.createObjectURL(file)
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSend = async () => {
    if (!message.trim() && !attachedFile) return
    
    const fileToSend = attachedFile
      ? {
          name: attachedFile.name,
          type: attachedFile.type,
          url: attachedFile.previewUrl
        }
      : undefined

    const userMsg = { role: 'user', content: message, file: fileToSend }
    setChat((prev) => [...prev, userMsg])
    
    const apiFileParam = attachedFile
      ? {
          data: attachedFile.base64,
          mime_type: attachedFile.type,
          name: attachedFile.name
        }
      : undefined

    const currentMsgText = message
    setMessage('')
    setAttachedFile(null)
    setSending(true)

    try {
      const res = await sendChatMessage(currentMsgText, apiFileParam, activeSessionId || undefined)
      
      // If this was a new chat session, set the active session ID and reload the sidebar
      if (!activeSessionId) {
        setActiveSessionId(res.session_id)
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_session_id', res.session_id)
        }
        loadSessionsList()
      }
      
      setChat((prev) => [...prev, { role: 'assistant', content: res.reply }])
    } catch (err: any) {
      setChat((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err.message || 'Server not connected. Check backend server running on :8080.'}` },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c16]">
        <div className="animate-pulse text-gray-400 text-lg">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#070710] text-white">
      {/* Sidebar on the Left */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-[#0c0a18] border-r border-[#221e3f] flex flex-col z-50 shrink-0 select-none transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-[#221e3f] flex items-center justify-between">
          <Logo iconSize={24} textColor="text-white" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 -mr-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25 transition-all hover:scale-[1.01]"
          >
            <span>+</span> New Chat
          </button>
        </div>

        {/* Chat History Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-3 mb-2">Recent Chats</p>
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-600 italic px-3 py-2">No past conversations</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.session_id}
                className={`flex items-center justify-between group rounded-xl px-3 py-2.5 text-sm transition-all cursor-pointer border-l-2 ${
                  activeSessionId === s.session_id
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white font-medium border-violet-500 shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border-transparent'
                }`}
                onClick={() => loadSession(s.session_id)}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-gray-500">💬</span>
                  <span className="truncate max-w-[145px]">{s.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(s.session_id)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-all rounded hover:bg-white/5 text-gray-500"
                  title="Delete chat thread"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* User Profile & Logout section at the bottom */}
        <div className="p-4 border-t border-[#221e3f] bg-[#080711]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold shadow-md">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="text-left truncate flex-1">
              <p className="text-xs font-bold text-gray-200 truncate">{user.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all text-xs"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-screen bg-[#070710]">
        {/* Header */}
        <header className="border-b border-[#221e3f] px-4 md:px-6 py-4 flex items-center gap-3 bg-[#0c0a18]/80 backdrop-blur-md sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all mr-2"
            title="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-semibold text-sm md:text-md text-gray-300 truncate">AI Employee Assistant</span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] md:text-xs text-violet-400 font-medium px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 shrink-0">
            Live
          </span>
          {activeSessionId && (
            <span className="ml-auto text-[10px] text-gray-500 bg-[#121124] border border-[#221e3f] rounded-lg px-2 py-1 truncate max-w-[80px] sm:max-w-none">
              Session: {activeSessionId.substring(0, 8)}...
            </span>
          )}
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl w-full mx-auto pb-48 md:pb-56">
          {chat.length === 0 && (
            <div className="text-center text-gray-500 mt-10 md:mt-20 max-w-md mx-auto animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#121124] border border-[#221e3f] flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-violet-950/10">🤖</div>
              <p className="text-xl font-bold text-gray-300">How can I help you today?</p>
              <p className="text-sm mt-2 text-gray-400/80 leading-relaxed px-4">
                Ask me text questions or upload an <strong className="font-semibold text-gray-200">image, video, audio, or document</strong> file and I'll analyze it for you!
              </p>
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] md:max-w-[80%] flex flex-col gap-2">
                {/* If user sent a file, render it above the text bubble */}
                {msg.role === 'user' && msg.file && (
                  <div className="self-end bg-[#181635] border border-[#2e2b54] rounded-2xl overflow-hidden shadow-lg p-2 max-w-sm">
                    {msg.file.type.startsWith('image/') && (
                      <img src={msg.file.url} alt="Uploaded attachment" className="rounded-xl max-h-60 object-contain" />
                    )}
                    {msg.file.type.startsWith('video/') && (
                      <video src={msg.file.url} controls className="rounded-xl max-h-60 object-contain" />
                    )}
                    {msg.file.type.startsWith('audio/') && (
                      <audio src={msg.file.url} controls className="w-full mt-1" />
                    )}
                    {!msg.file.type.startsWith('image/') && !msg.file.type.startsWith('video/') && !msg.file.type.startsWith('audio/') && (
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-2xl">📄</span>
                        <div className="text-left">
                           <p className="text-xs font-semibold text-gray-200 truncate max-w-[150px] sm:max-w-[200px]">{msg.file.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{msg.file.type.split('/')[1] || 'document'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text message bubble */}
                {(msg.content || !msg.file) && (
                  <div
                    className={`px-4 py-2.5 md:px-5 md:py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap relative group ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-violet-600/20'
                        : 'bg-[#121124] text-gray-200 rounded-bl-sm border border-[#262347] shadow-md pr-10'
                    }`}
                  >
                    {parseMessageContent(msg.content)}
                    {msg.role === 'assistant' && msg.content && (
                      <CopyButton text={msg.content} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-[#121124] border border-[#262347] px-5 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar container */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#070710] via-[#070710]/95 to-transparent p-4 md:p-6 z-30">
          <div className="max-w-4xl mx-auto">
            
            {/* File preview box above input */}
            {attachedFile && (
              <div className="mb-3 p-3 bg-[#181635] border border-[#2e2b54] rounded-2xl flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  {attachedFile.type.startsWith('image/') ? (
                    <img src={attachedFile.previewUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                  ) : attachedFile.type.startsWith('video/') ? (
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl border border-white/10 flex items-center justify-center text-xl">🎬</div>
                  ) : attachedFile.type.startsWith('audio/') ? (
                    <div className="w-12 h-12 bg-pink-500/10 rounded-xl border border-white/10 flex items-center justify-center text-xl">🎵</div>
                  ) : (
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl border border-white/10 flex items-center justify-center text-xl">📄</div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-200 max-w-[150px] sm:max-w-[250px] truncate">{attachedFile.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{attachedFile.type || 'unknown type'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Form */}
            <div className="bg-[#14132b] border border-[#2e2b54] rounded-2xl p-2 md:p-2.5 flex items-center gap-1.5 md:gap-2 shadow-2xl focus-within:border-violet-500/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300">
              {/* Attachment Button */}
              <label className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#201e3d]/40 border border-[#2e2b54]/60 hover:border-violet-500/40 hover:bg-[#201e3d]/85 flex items-center justify-center cursor-pointer text-gray-400 hover:text-white transition-all shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*,audio/*,application/pdf,text/*"
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={attachedFile ? "Ask AI Employee to analyze the attached file..." : "Ask AI Employee anything..."}
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-3 text-sm text-white placeholder-gray-500 min-w-0"
              />

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`w-10 h-10 md:w-11 md:h-11 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  isListening
                    ? 'bg-[#ec4899]/20 border-[#ec4899]/50 text-[#ec4899] animate-pulse shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                    : 'bg-[#201e3d]/40 border-[#2e2b54]/60 hover:border-violet-500/40 hover:bg-[#201e3d]/85 text-gray-400 hover:text-white'
                }`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={sending || (!message.trim() && !attachedFile)}
                className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center font-semibold transition-all shadow-md shadow-violet-600/10 shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

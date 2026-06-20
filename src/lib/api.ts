const API_BASE = 'http://localhost:8080';

// ---- Token management ----

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

// ---- Auth helpers ----

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// Helper to handle API responses robustly (even if they are not JSON)
async function handleResponse(res: Response, defaultError: string): Promise<any> {
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!res.ok) {
    if (isJson) {
      const data = await res.json();
      throw new Error(data.error || defaultError);
    } else {
      const text = await res.text();
      // If server returned a generic HTML page or empty string, fallback
      const cleanText = text.trim();
      if (cleanText.startsWith('<!DOCTYPE') || cleanText.startsWith('<html') || !cleanText) {
        throw new Error(`Server returned HTTP ${res.status}. Please make sure the backend server is restarted and running.`);
      }
      throw new Error(cleanText);
    }
  }

  if (isJson) {
    return res.json();
  }
  return null;
}

// ---- API calls ----

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
  provider: string;
  is_verified: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await handleResponse(res, 'Registration failed');
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res, 'Login failed');
  setToken(data.token);
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  const data = await handleResponse(res, 'Google login failed');
  setToken(data.token);
  return data;
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(),
  });
  return handleResponse(res, 'Not authenticated');
}

export function logout() {
  clearToken();
}

export interface FileData {
  data: string; // base64 encoded string
  mime_type: string;
}

export interface ChatSession {
  session_id: string;
  start_time: string;
  title: string;
}

export interface ChatMessage {
  role: string;
  content: string;
  file?: {
    name: string;
    type: string;
    url: string;
  };
}

export async function sendChatMessage(message: string, file?: FileData, sessionId?: string): Promise<{ reply: string; session_id: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, file, session_id: sessionId }),
  });
  return handleResponse(res, 'Chat failed');
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/api/chat/sessions`, {
    headers: authHeaders(),
  });
  return handleResponse(res, 'Failed to fetch sessions');
}

export async function getChatSessionHistory(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res, 'Failed to fetch session history');
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse(res, 'Failed to delete session');
}

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  await handleResponse(res, 'Verification failed');
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  await handleResponse(res, 'Resend verification link failed');
}

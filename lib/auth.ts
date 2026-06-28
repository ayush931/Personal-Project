import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface UserSession {
  id: string;
  username: string;
  role: string;
  avatarCustomization: string;
}

// Simple cookie-based session management for PixelVerse
// This allows guests and standard users to log in instantly
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('pixelverse_session');
  if (!sessionCookie) return null;

  try {
    const data = JSON.parse(decodeURIComponent(sessionCookie.value));
    return data;
  } catch (e) {
    return null;
  }
}

export async function setSession(session: UserSession) {
  const cookieStore = await cookies();
  cookieStore.set('pixelverse_session', encodeURIComponent(JSON.stringify(session)), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: false, // Available to client-side for immediate hydration
    sameSite: 'lax',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('pixelverse_session');
}

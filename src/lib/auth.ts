/**
 * Auth utilities for Shelf
 * Handles both dev fake tokens and real Fanvue tokens
 */

export interface ShelfUser {
  fanvueUserUuid: string;
  role: 'fan' | 'creator';
  displayName: string;
  creatorId: string;
  fanId?: string;
  creatorHandle: string;
}

export function parseDevToken(token: string): ShelfUser | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

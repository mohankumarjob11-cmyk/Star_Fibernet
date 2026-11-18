import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export type DbUser = typeof users.$inferSelect;

export interface AuthenticatedRequest extends Request {
  dbUser?: DbUser;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'star-fibernet-session-hmac-secret-2026';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

interface SessionPayload {
  uid: string;
  email: string;
  role: string;
  exp: number;
}

export function signSessionToken(user: DbUser): string {
  const payload: SessionPayload = {
    uid: user.uid,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `sf.${data}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token.startsWith('sf.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Simple in-memory rate limiter for login protection
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 12) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function clearLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}

export async function upsertFirebaseUser(
  uid: string,
  email: string,
  fullName?: string
): Promise<DbUser> {
  try {
    const referralCode = `STAR-${uid.slice(0, 6).toUpperCase()}`;
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email.toLowerCase(),
        fullName: fullName || email.split('@')[0],
        role: 'customer',
        emailVerified: true,
        referralCode,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email.toLowerCase(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('upsertFirebaseUser failed:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const match = cookies.find((c) => c.startsWith('sf_token='));
    if (match) {
      return decodeURIComponent(match.slice('sf_token='.length));
    }
  }
  return null;
}

async function resolveUserFromToken(token: string): Promise<DbUser | null> {
  // 1. Check signed server session token
  const session = verifySessionToken(token);
  if (session) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.uid, session.uid))
      .limit(1);
    return rows[0] ?? null;
  }

  // 2. Fallback to Firebase ID Token verification
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email || `${decoded.uid}@firebase.user`;
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existingByEmail[0] && existingByEmail[0].uid !== decoded.uid) {
      return existingByEmail[0];
    }
    return await upsertFirebaseUser(
      decoded.uid,
      email,
      decoded.name || email.split('@')[0]
    );
  } catch {
    return null;
  }
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const user = await resolveUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    if (user.isBlocked) {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support.',
      });
    }
    req.dbUser = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication check failed.' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await resolveUserFromToken(token);
      if (user && !user.isBlocked) {
        req.dbUser = user;
      }
    }
  } catch {
    // Ignore optional auth failures
  }
  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.dbUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.dbUser.role !== 'admin') {
    return res.status(403).json({
      error: 'Administrator access required. Customers cannot access admin resources.',
    });
  }
  next();
};

export function sanitizeUser(user: DbUser) {
  return {
    id: user.id,
    uid: user.uid,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    role: user.role,
    isBlocked: user.isBlocked,
    emailVerified: user.emailVerified,
    mustChangePassword: user.mustChangePassword,
    referralCode: user.referralCode,
    rewardPoints: user.rewardPoints,
    createdAt: user.createdAt,
  };
}

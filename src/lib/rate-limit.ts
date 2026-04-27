// src/lib/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Persistent Rate Limiter (Upstash Redis)
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: 'vexor_ratelimit',
    })
  : null;

// Memory Fallback for Development
const memoryStore: Record<string, { count: number; resetTime: number }> = {};

export async function withRateLimit(
  req: NextRequest,
  limit: number,
  windowMs: number,
  handler: () => Promise<NextResponse>
) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
  const key = `${req.nextUrl.pathname}:${ip}`;

  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(key);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', resetIn: Math.ceil((reset - Date.now()) / 1000) },
        { status: 429 }
      );
    }
  } else {
    // Memory Fallback
    const now = Date.now();
    if (!memoryStore[key] || now > memoryStore[key].resetTime) {
      memoryStore[key] = { count: 0, resetTime: now + windowMs };
    }
    memoryStore[key].count++;
    if (memoryStore[key].count > limit) {
      return NextResponse.json(
        { error: 'Too many requests (Memory Fallback)', resetIn: Math.ceil((memoryStore[key].resetTime - now) / 1000) },
        { status: 429 }
      );
    }
  }

  return handler();
}

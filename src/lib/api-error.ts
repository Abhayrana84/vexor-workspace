// src/lib/api-error.ts
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export function handleApiError(error: any) {
  const requestId = uuidv4();
  
  // Log full error server-side
  console.error(`[API Error] RequestId: ${requestId}`, error);

  return NextResponse.json(
    { 
      error: 'Internal server error', 
      requestId 
    }, 
    { status: 500 }
  );
}

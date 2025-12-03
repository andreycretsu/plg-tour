import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    const result = await query('SELECT NOW() as time, version() as version');
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      time: result.rows[0]?.time,
      postgres_version: result.rows[0]?.version,
      env_check: {
        has_database_url: !!process.env.DATABASE_URL,
        has_jwt_secret: !!process.env.JWT_SECRET,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}


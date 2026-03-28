// app/api/video/[id]/route.ts — Serve cached video files from CACHE_DIR
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const cacheDir = process.env.CACHE_DIR || '/tmp/ai-exp-cache';

    // Sanitize: ensure filename doesn't contain path traversal
    const sanitizedId = path.basename(id);
    const filePath = path.join(cacheDir, sanitizedId);

    // Ensure the resolved path stays within CACHE_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedCacheDir = path.resolve(cacheDir);
    if (!resolvedPath.startsWith(resolvedCacheDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Read file and serve as video/mp4
    const buffer = fs.readFileSync(resolvedPath);
    const ext = path.extname(sanitizedId).toLowerCase();

    let contentType = 'video/mp4';
    if (ext === '.webm') contentType = 'video/webm';

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(buffer.length),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: unknown) {
    console.error('[Video API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 }
    );
  }
}

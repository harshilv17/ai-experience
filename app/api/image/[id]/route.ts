// app/api/image/[id]/route.ts — Serve cached images from CACHE_DIR
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
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Read file and determine content type
    const buffer = fs.readFileSync(resolvedPath);
    const ext = path.extname(sanitizedId).toLowerCase();

    let contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error: unknown) {
    console.error('[Image API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}

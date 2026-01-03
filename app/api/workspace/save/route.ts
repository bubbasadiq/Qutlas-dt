import crypto from 'node:crypto';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getDownloadUrl, uploadObject } from '@/lib/storage/supabase-s3';

const WORKSPACES_BUCKET = 'workspaces';

type WorkspaceIndexEntry = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type WorkspaceRecord = WorkspaceIndexEntry & {
  user_id: string;
  data: string;
};

function workspaceKey(userId: string, workspaceId: string) {
  return `${userId}/${workspaceId}.json`;
}

function indexKey(userId: string) {
  return `${userId}/index.json`;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 350): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}

async function loadWorkspaceIndex(userId: string): Promise<WorkspaceIndexEntry[]> {
  const url = getDownloadUrl({
    bucket: WORKSPACES_BUCKET,
    key: indexKey(userId),
    expiresInSeconds: 60,
  });
  const res = await fetch(url);

  if (res.status === 404) return [];
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to load workspace index (${res.status}): ${text}`);
  }

  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) return [];
  return json as WorkspaceIndexEntry[];
}

async function saveWorkspaceIndex(userId: string, entries: WorkspaceIndexEntry[]) {
  const content = JSON.stringify(entries, null, 2);
  await uploadObject({
    bucket: WORKSPACES_BUCKET,
    key: indexKey(userId),
    body: content,
    contentType: 'application/json',
  });
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Workspace save auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { name?: unknown; data?: unknown } | null;

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const data = typeof body?.data === 'string' ? body.data : '';

    if (!name) {
      return NextResponse.json({ error: 'Invalid request: name is required' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Invalid request: data is required' }, { status: 400 });
    }

    try {
      JSON.parse(data);
    } catch {
      return NextResponse.json(
        { error: 'Invalid request: data must be valid JSON string' },
        { status: 400 }
      );
    }

    const workspaceId = `ws_${Date.now().toString(36)}_${crypto
      .randomBytes(5)
      .toString('hex')}`;
    const now = new Date().toISOString();

    const record: WorkspaceRecord = {
      id: workspaceId,
      user_id: user.id,
      name,
      data,
      created_at: now,
      updated_at: now,
    };

    await withRetry(
      () =>
        uploadObject({
          bucket: WORKSPACES_BUCKET,
          key: workspaceKey(user.id, workspaceId),
          body: JSON.stringify(record, null, 2),
          contentType: 'application/json',
        }),
      2
    );

    const index = await withRetry(() => loadWorkspaceIndex(user.id), 2);
    const nextIndex: WorkspaceIndexEntry[] = [
      {
        id: record.id,
        name: record.name,
        created_at: record.created_at,
        updated_at: record.updated_at,
      },
      ...index,
    ];

    await withRetry(() => saveWorkspaceIndex(user.id, nextIndex), 2);

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error('Workspace save error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save workspace';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Storage helpers with Supabase primary and local-disk fallback

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_BUCKET = "media";
const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const LOCAL_UPLOAD_PREFIX = "/uploads";

function getAssetBaseUrl() {
  return (
    process.env.PUBLIC_ASSET_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    ""
  ).replace(/\/+$/, "");
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return { supabaseUrl: supabaseUrl.replace(/\/+$/, ""), supabaseKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function buildLocalUrl(key: string): string {
  const base = getAssetBaseUrl();
  const rel = `${LOCAL_UPLOAD_PREFIX}/${key}`;
  return base ? `${base}${rel}` : rel;
}

async function localPut(key: string, data: Buffer | Uint8Array | string): Promise<{ key: string; url: string }> {
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
  const fullPath = path.join(LOCAL_UPLOAD_ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, body);
  return { key, url: buildLocalUrl(key) };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const supabase = getSupabaseConfig();

  if (!supabase) {
    return localPut(key, data);
  }

  const uploadUrl = `${supabase.supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${key}`;
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : data;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabase.supabaseKey}`,
      apikey: supabase.supabaseKey,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: body as any,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status} ${response.statusText}): ${message}`);
  }

  const url = `${supabase.supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const supabase = getSupabaseConfig();

  if (!supabase) {
    return { key, url: buildLocalUrl(key) };
  }

  return {
    key,
    url: `${supabase.supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`,
  };
}

export async function storageDelete(relKey: string): Promise<void> {
  const key = normalizeKey(relKey);
  const supabase = getSupabaseConfig();

  if (!supabase) {
    const fullPath = path.join(LOCAL_UPLOAD_ROOT, key);
    await rm(fullPath, { force: true }).catch(() => undefined);
    return;
  }

  const deleteUrl = `${supabase.supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${key}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${supabase.supabaseKey}`,
      apikey: supabase.supabaseKey,
    },
  });

  if (!response.ok && response.status !== 404) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage delete failed (${response.status} ${response.statusText}): ${message}`);
  }
}

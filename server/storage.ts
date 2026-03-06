// Storage helpers using Supabase Storage
// Uploads files to a public Supabase Storage bucket named "media"

const SUPABASE_BUCKET = "media";

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase credentials missing: set SUPABASE_URL and SUPABASE_ANON_KEY"
    );
  }

  return { supabaseUrl: supabaseUrl.replace(/\/+$/, ""), supabaseKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const key = normalizeKey(relKey);

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${key}`;

  const body =
    typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : data;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: body as any,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }

  // Public URL for the uploaded file
  const url = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const { supabaseUrl } = getSupabaseConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`,
  };
}

export async function storageDelete(relKey: string): Promise<void> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const key = normalizeKey(relKey);

  const deleteUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${key}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
    },
  });

  if (!response.ok && response.status !== 404) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage delete failed (${response.status} ${response.statusText}): ${message}`
    );
  }
}

import crypto from "node:crypto"

export interface SupabaseS3Config {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export function getSupabaseS3Config(): SupabaseS3Config {
  const endpoint =
    process.env.SUPABASE_S3_ENDPOINT ||
    "https://lzgfbipfclzeiscgjfsy.storage.supabase.co/storage/v1/s3"
  const region = process.env.SUPABASE_S3_REGION || "eu-north-1"

  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Supabase S3 credentials are not configured. Set SUPABASE_S3_ACCESS_KEY_ID and SUPABASE_S3_SECRET_ACCESS_KEY."
    )
  }

  return { endpoint, region, accessKeyId, secretAccessKey }
}

function hmac(key: crypto.BinaryLike, data: string) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest()
}

function sha256Hex(data: string) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex")
}

function toAmzDate(date: Date) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "")
  return { amzDate: iso, dateStamp: iso.slice(0, 8) }
}

function uriEncodePath(path: string) {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/")
}

export function getObjectPath(bucket: string, key: string) {
  const { endpoint } = getSupabaseS3Config()
  const base = new URL(endpoint)
  // Supabase's S3-compatible endpoint uses path-style URLs.
  return `${base.pathname.replace(/\/$/, "")}/${uriEncodePath(bucket)}/${uriEncodePath(key)}`
}

export function presignUrl(params: {
  method: "GET" | "PUT" | "DELETE"
  bucket: string
  key: string
  expiresInSeconds?: number
  contentType?: string
}) {
  const { method, bucket, key, expiresInSeconds = 60 * 10 } = params
  const { endpoint, region, accessKeyId, secretAccessKey } = getSupabaseS3Config()

  const now = new Date()
  const { amzDate, dateStamp } = toAmzDate(now)

  const base = new URL(endpoint)
  const host = base.host
  const canonicalUri = getObjectPath(bucket, key)

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`

  // Query params must be sorted by key.
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  }

  const canonicalQueryString = Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join("&")

  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = "host"
  const payloadHash = "UNSIGNED-PAYLOAD"

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n")

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, "s3")
  const kSigning = hmac(kService, "aws4_request")
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex")

  const url = new URL(endpoint)
  url.pathname = canonicalUri
  url.search = `${canonicalQueryString}&X-Amz-Signature=${signature}`

  return url.toString()
}

export async function uploadObject(params: {
  bucket: string
  key: string
  body: BodyInit
  contentType: string
}) {
  const url = presignUrl({ method: "PUT", bucket: params.bucket, key: params.key, expiresInSeconds: 60 * 10 })

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": params.contentType,
    },
    body: params.body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to upload object to storage (${res.status}): ${text}`)
  }

  return {
    bucket: params.bucket,
    key: params.key,
  }
}

export async function deleteObject(params: { bucket: string; key: string }) {
  const url = presignUrl({ method: "DELETE", bucket: params.bucket, key: params.key, expiresInSeconds: 60 * 10 })

  const res = await fetch(url, {
    method: "DELETE",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to delete object from storage (${res.status}): ${text}`)
  }

  return {
    bucket: params.bucket,
    key: params.key,
  }
}

export function getDownloadUrl(params: { bucket: string; key: string; expiresInSeconds?: number }) {
  return presignUrl({
    method: "GET",
    bucket: params.bucket,
    key: params.key,
    expiresInSeconds: params.expiresInSeconds ?? 60 * 10,
  })
}

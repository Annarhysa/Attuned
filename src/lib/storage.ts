import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Storage driver abstraction, same shape as the AIProvider swap: local disk
 * by default (zero setup, works on any host with a persistent filesystem --
 * a VPS, Railway, Fly, Docker), S3-compatible object storage when
 * STORAGE_DRIVER=s3 (required on serverless hosts like Vercel/Netlify, whose
 * filesystem doesn't persist across invocations). Works with AWS S3,
 * Supabase Storage, Cloudflare R2, or any S3-compatible endpoint via
 * S3_ENDPOINT.
 */

interface StorageDriver {
  save(buffer: Buffer, originalName: string): Promise<string>;
  read(fileId: string): Promise<Buffer>;
}

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.STORAGE_DIR || './storage');

class LocalDriver implements StorageDriver {
  private async ensureRoot() {
    await fs.mkdir(STORAGE_ROOT, { recursive: true });
  }

  async save(buffer: Buffer, originalName: string): Promise<string> {
    await this.ensureRoot();
    const id = randomUUID();
    const ext = path.extname(originalName) || '';
    const fileId = `${id}${ext}`;
    await fs.writeFile(path.join(STORAGE_ROOT, fileId), buffer);
    await fs.writeFile(path.join(STORAGE_ROOT, `${id}.meta.json`), JSON.stringify({ originalName }));
    return fileId;
  }

  async read(fileId: string): Promise<Buffer> {
    return fs.readFile(path.join(STORAGE_ROOT, fileId));
  }
}

class S3Driver implements StorageDriver {
  private bucket = process.env.S3_BUCKET || '';
  private clientPromise = this.buildClient();

  private async buildClient() {
    const { S3Client } = await import('@aws-sdk/client-s3');
    return new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async save(buffer: Buffer, originalName: string): Promise<string> {
    if (!this.bucket) throw new Error('S3_BUCKET is not set but STORAGE_DRIVER=s3.');
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.clientPromise;
    const id = randomUUID();
    const ext = path.extname(originalName) || '';
    const fileId = `${id}${ext}`;
    await client.send(new PutObjectCommand({ Bucket: this.bucket, Key: fileId, Body: buffer }));
    return fileId;
  }

  async read(fileId: string): Promise<Buffer> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.clientPromise;
    const res = await client.send(new GetObjectCommand({ Bucket: this.bucket, Key: fileId }));
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body as AsyncIterable<Buffer>) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
}

function getDriver(): StorageDriver {
  return (process.env.STORAGE_DRIVER || 'local') === 's3' ? new S3Driver() : new LocalDriver();
}

/**
 * Persists an uploaded file's raw bytes, unmodified, and returns an id used
 * to retrieve it later. Originals are never overwritten -- each save gets a
 * fresh id.
 */
export async function saveOriginalFile(buffer: Buffer, originalName: string): Promise<string> {
  return getDriver().save(buffer, originalName);
}

export async function readStoredFile(fileId: string): Promise<Buffer> {
  return getDriver().read(fileId);
}

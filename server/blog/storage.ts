import { randomUUID } from "node:crypto";
import { Client } from "@replit/object-storage";

// App Storage is required for new covers. Database bytea is retained only to
// serve covers created before the storage migration.
export function blogStorageReady(): boolean {
  return Boolean(process.env.BLOG_STORAGE_BUCKET_ID || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID);
}

function storage() {
  const bucketId = process.env.BLOG_STORAGE_BUCKET_ID || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) throw new Error("Ative um bucket do App Storage para gerar e salvar capas do blog.");
  return new Client({ bucketId });
}

export async function uploadBlogCover(articleId: string, data: Buffer, mime: string) {
  const extension = mime === "image/png" ? "png" : "jpg";
  const key = `blog/covers/${articleId}/${randomUUID()}.${extension}`;
  const result = await storage().uploadFromBytes(key, data);
  if (!result.ok) throw new Error(`Falha ao guardar a capa no App Storage: ${result.error.message}`);
  return key;
}

export async function downloadBlogCover(key: string) {
  if (!/^blog\/covers\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg)$/.test(key)) {
    throw new Error("Chave de capa inválida.");
  }
  const result = await storage().downloadAsBytes(key);
  if (!result.ok) throw new Error(`Capa indisponível no App Storage: ${result.error.message}`);
  return result.value[0];
}

export async function deleteBlogCover(key: string) {
  const result = await storage().delete(key, { ignoreNotFound: true });
  if (!result.ok) throw new Error(`Não foi possível remover a capa antiga: ${result.error.message}`);
}
/**
 * Storage adapter cho ảnh. Driver mặc định "db": lưu bytea trong Postgres (không cần dịch vụ ngoài).
 * Sau này thêm driver "s3"/"r2" chỉ cần cài đặt cùng interface này rồi chọn qua env STORAGE_DRIVER.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { image } from "@/server/db/schema";
import type { ImageMime } from "@/lib/image-sniff";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Exec = typeof db | Tx;

export type StoredImage = { id: string; mime: string; data: Buffer; size: number };

export interface ImageStorage {
  put(
    exec: Exec,
    input: { userId: string; bytes: Buffer; mime: ImageMime; width: number; height: number },
  ): Promise<string>;
  /** Chỉ trả ảnh thuộc đúng userId. */
  get(userId: string, id: string): Promise<StoredImage | null>;
  remove(exec: Exec, userId: string, ids: string[]): Promise<void>;
  /** Sao chép ảnh sang người khác (khi nhận chia sẻ). */
  copy(exec: Exec, fromUserId: string, id: string, toUserId: string): Promise<string | null>;
}

const dbStorage: ImageStorage = {
  async put(exec, { userId, bytes, mime, width, height }) {
    const [row] = await exec
      .insert(image)
      .values({ userId, mime, data: bytes, size: bytes.length, width, height })
      .returning({ id: image.id });
    return row!.id;
  },
  async get(userId, id) {
    const [row] = await db
      .select({ id: image.id, mime: image.mime, data: image.data, size: image.size })
      .from(image)
      .where(and(eq(image.id, id), eq(image.userId, userId)))
      .limit(1);
    return row ?? null;
  },
  async remove(exec, userId, ids) {
    if (!ids.length) return;
    await exec.delete(image).where(and(eq(image.userId, userId), inArray(image.id, ids)));
  },
  async copy(exec, fromUserId, id, toUserId) {
    const [src] = await exec
      .select()
      .from(image)
      .where(and(eq(image.id, id), eq(image.userId, fromUserId)))
      .limit(1);
    if (!src) return null;
    const [row] = await exec
      .insert(image)
      .values({
        userId: toUserId,
        mime: src.mime,
        data: src.data,
        size: src.size,
        width: src.width,
        height: src.height,
      })
      .returning({ id: image.id });
    return row!.id;
  },
};

export const storage: ImageStorage = dbStorage;

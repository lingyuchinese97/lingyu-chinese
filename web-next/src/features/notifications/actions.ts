"use server";
import { z } from "zod";
import { currentUserOrThrow } from "@/server/session";
import { listNotifications, markRead, unreadCount } from "./service";
import { listReceived } from "@/features/grammar/service";

/** Dữ liệu cho chuông: danh sách thông báo + lời mời ngữ pháp còn chờ (để biết thông báo nào còn nút Chấp nhận/Từ chối). */
export async function bellAction() {
  const u = await currentUserOrThrow();
  const [items, unread, pending] = await Promise.all([listNotifications(u.id), unreadCount(u.id), listReceived(u.id)]);
  return { items, unread, pendingGrammar: pending.map((p) => p.id) };
}

export async function markReadAction(ids?: string[]) {
  const u = await currentUserOrThrow();
  await markRead(u.id, ids ? z.array(z.uuid()).max(100).parse(ids) : undefined);
}

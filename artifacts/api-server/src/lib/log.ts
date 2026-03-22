import { db } from "@workspace/db";
import { logsTable } from "@workspace/db";

export async function logAction(action: string, userId?: number | null, details?: string) {
  try {
    await db.insert(logsTable).values({ action, userId: userId ?? null, details: details ?? null });
  } catch {
  }
}

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: "device_added" | "request_pending" | "request_approved" | "request_rejected" | "weekly_winner"
) {
  try {
    const { notificationsTable } = await import("@workspace/db");
    await db.insert(notificationsTable).values({ userId, title, message, type, read: false });
  } catch {
  }
}

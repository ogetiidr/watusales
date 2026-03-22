import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const notifs = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, sessionUserId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(notifs);
});

router.put("/:id/read", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, sessionUserId)));
  res.json({ success: true, message: "Marked as read" });
});

export default router;

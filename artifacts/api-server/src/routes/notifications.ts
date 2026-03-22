import { Router } from "express";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";

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

router.post("/send", requireRole("admin", "leader"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const sessionRole = (req as any).session?.role;
  const { title, message, targetType, targetUserId } = req.body;

  if (!title || !message || !targetType) {
    res.status(400).json({ error: "title, message, targetType required" });
    return;
  }

  let targetUsers: { id: number }[] = [];

  if (targetType === "user" && targetUserId) {
    targetUsers = [{ id: targetUserId }];
  } else if (targetType === "all") {
    let query = db.select({ id: usersTable.id }).from(usersTable);
    if (sessionRole === "leader") {
      const agents = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(eq(usersTable.role, "agent"), eq(usersTable.leaderId, sessionUserId)));
      targetUsers = agents;
    } else {
      targetUsers = await query;
    }
  } else if (targetType === "agents") {
    let where: any[] = [eq(usersTable.role, "agent")];
    if (sessionRole === "leader") where.push(eq(usersTable.leaderId, sessionUserId));
    targetUsers = await db.select({ id: usersTable.id }).from(usersTable).where(and(...where));
  } else if (targetType === "leaders") {
    targetUsers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "leader"));
  }

  if (targetUsers.length === 0) {
    res.json({ success: true, message: "No users to notify" });
    return;
  }

  await db.insert(notificationsTable).values(
    targetUsers.map(u => ({ userId: u.id, title, message, type: "message" as const, read: false }))
  );

  res.json({ success: true, message: `Notification sent to ${targetUsers.length} user(s)` });
});

export default router;

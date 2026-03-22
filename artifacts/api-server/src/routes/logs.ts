import { Router } from "express";
import { db, logsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth, requireRole("admin", "leader"));

router.get("/", async (req, res) => {
  const { limit = "50", offset = "0", userId } = req.query as any;

  const logs = await db
    .select()
    .from(logsTable)
    .where(userId ? eq(logsTable.userId, parseInt(userId)) : undefined)
    .orderBy(desc(logsTable.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  const total = await db.select({ count: sql<number>`count(*)::int` }).from(logsTable);

  const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
  const usersMap = new Map<number, string>();
  if (userIds.length) {
    const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    users.forEach(u => usersMap.set(u.id, u.name));
  }

  res.json({
    logs: logs.map(l => ({
      ...l,
      userName: l.userId ? (usersMap.get(l.userId) ?? null) : null,
    })),
    total: total[0]?.count ?? 0,
  });
});

export default router;

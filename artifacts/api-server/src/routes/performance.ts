import { Router } from "express";
import { db, devicesTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/daily", async (req, res) => {
  const { date, leaderId } = req.query as any;
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  const targetDate = date ? new Date(date) : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  let where: any[] = [
    gte(devicesTable.dateAdded, dayStart),
    lte(devicesTable.dateAdded, dayEnd),
    eq(devicesTable.status, "active"),
  ];

  let effectiveLeaderId = leaderId ? parseInt(leaderId) : null;
  if (sessionRole === "leader") effectiveLeaderId = sessionUserId;
  if (effectiveLeaderId) where.push(eq(devicesTable.leaderId, effectiveLeaderId));

  const result = await db
    .select({
      agentId: devicesTable.agentId,
      devicesCount: sql<number>`count(*)::int`,
    })
    .from(devicesTable)
    .where(and(...where))
    .groupBy(devicesTable.agentId)
    .orderBy(sql`count(*) desc`);

  const agentIds = result.map(r => r.agentId).filter(Boolean) as number[];
  const agents = agentIds.length
    ? await db.select({ id: usersTable.id, name: usersTable.name, leaderId: usersTable.leaderId }).from(usersTable)
    : [];
  const agentsMap = new Map(agents.map(a => [a.id, a]));

  const leaderIds = [...new Set(agents.map(a => a.leaderId).filter(Boolean))];
  const leaders = leaderIds.length ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable) : [];
  const leadersMap = new Map(leaders.map(l => [l.id, l.name]));

  const rankings = result.map((r, i) => {
    const agent = r.agentId ? agentsMap.get(r.agentId) : null;
    return {
      rank: i + 1,
      agentId: r.agentId ?? 0,
      agentName: agent?.name ?? "Unknown",
      leaderId: agent?.leaderId ?? null,
      leaderName: agent?.leaderId ? (leadersMap.get(agent.leaderId) ?? null) : null,
      devicesCount: r.devicesCount,
      date: dayStart.toISOString().split("T")[0],
    };
  });

  res.json(rankings);
});

router.get("/weekly", async (req, res) => {
  const { weekStart, leaderId } = req.query as any;
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  const now = new Date();
  let wStart: Date;
  if (weekStart) {
    wStart = new Date(weekStart);
  } else {
    const day = now.getDay();
    const diff = (day + 6) % 7;
    wStart = new Date(now);
    wStart.setDate(now.getDate() - diff);
    wStart.setHours(0, 0, 0, 0);
  }

  const wEnd = new Date(wStart);
  wEnd.setDate(wStart.getDate() + 6);
  wEnd.setHours(23, 59, 59, 999);

  const isFinalized = wEnd < now;

  let where: any[] = [
    gte(devicesTable.dateAdded, wStart),
    lte(devicesTable.dateAdded, wEnd),
    eq(devicesTable.status, "active"),
  ];

  let effectiveLeaderId = leaderId ? parseInt(leaderId) : null;
  if (sessionRole === "leader") effectiveLeaderId = sessionUserId;
  if (effectiveLeaderId) where.push(eq(devicesTable.leaderId, effectiveLeaderId));

  const result = await db
    .select({
      agentId: devicesTable.agentId,
      devicesCount: sql<number>`count(*)::int`,
    })
    .from(devicesTable)
    .where(and(...where))
    .groupBy(devicesTable.agentId)
    .orderBy(sql`count(*) desc`);

  const agents = await db.select({ id: usersTable.id, name: usersTable.name, leaderId: usersTable.leaderId }).from(usersTable);
  const agentsMap = new Map(agents.map(a => [a.id, a]));
  const leadersMap = new Map(agents.map(a => [a.id, a.name]));

  const rankings = result.map((r, i) => {
    const agent = r.agentId ? agentsMap.get(r.agentId) : null;
    return {
      rank: i + 1,
      agentId: r.agentId ?? 0,
      agentName: agent?.name ?? "Unknown",
      leaderId: agent?.leaderId ?? null,
      leaderName: agent?.leaderId ? (leadersMap.get(agent.leaderId) ?? null) : null,
      devicesCount: r.devicesCount,
      date: wStart.toISOString().split("T")[0],
    };
  });

  res.json({
    weekStart: wStart.toISOString().split("T")[0],
    weekEnd: wEnd.toISOString().split("T")[0],
    isFinalized,
    rankings,
  });
});

export default router;

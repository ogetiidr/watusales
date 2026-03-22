import { Router } from "express";
import { db, devicesTable, usersTable, requestsTable, logsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/admin", requireRole("admin"), async (_req, res) => {
  const [leadersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "leader"));
  const [agentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "agent"));
  const [devicesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(devicesTable).where(eq(devicesTable.status, "active"));

  const now = new Date();
  const dayStart = new Date(now); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999);

  const [todaySales] = await db.select({ count: sql<number>`count(*)::int` }).from(devicesTable)
    .where(and(gte(devicesTable.dateAdded, dayStart), lte(devicesTable.dateAdded, dayEnd), eq(devicesTable.status, "active")));

  const topAgent = await db
    .select({ agentId: devicesTable.agentId, devicesCount: sql<number>`count(*)::int` })
    .from(devicesTable)
    .where(and(gte(devicesTable.dateAdded, dayStart), lte(devicesTable.dateAdded, dayEnd), eq(devicesTable.status, "active")))
    .groupBy(devicesTable.agentId)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  let topAgentToday = null;
  if (topAgent.length && topAgent[0].agentId) {
    const agent = await db.select({ id: usersTable.id, name: usersTable.name, leaderId: usersTable.leaderId }).from(usersTable).where(eq(usersTable.id, topAgent[0].agentId)).limit(1);
    if (agent.length) {
      const leader = agent[0].leaderId ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, agent[0].leaderId)).limit(1) : [];
      topAgentToday = {
        rank: 1,
        agentId: agent[0].id,
        agentName: agent[0].name,
        leaderId: agent[0].leaderId ?? null,
        leaderName: leader[0]?.name ?? null,
        devicesCount: topAgent[0].devicesCount,
        date: dayStart.toISOString().split("T")[0],
      };
    }
  }

  res.json({
    totalLeaders: leadersCount?.count ?? 0,
    totalAgents: agentsCount?.count ?? 0,
    totalDevices: devicesCount?.count ?? 0,
    todaySales: todaySales?.count ?? 0,
    topAgentToday,
  });
});

router.get("/leader", requireRole("leader"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;

  const [agentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable)
    .where(and(eq(usersTable.role, "agent"), eq(usersTable.leaderId, sessionUserId)));

  const [devicesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(devicesTable)
    .where(and(eq(devicesTable.leaderId, sessionUserId), eq(devicesTable.status, "active")));

  const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(requestsTable)
    .where(eq(requestsTable.status, "pending"));

  const recentActivity = await db.select().from(logsTable).orderBy(desc(logsTable.createdAt)).limit(5);

  res.json({
    totalAgents: agentsCount?.count ?? 0,
    totalDevices: devicesCount?.count ?? 0,
    pendingRequests: pendingCount?.count ?? 0,
    recentActivity: recentActivity.map(l => ({ ...l, userName: null })),
  });
});

router.get("/agent", requireRole("agent"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;

  const [myDevices] = await db.select({ count: sql<number>`count(*)::int` }).from(devicesTable)
    .where(and(eq(devicesTable.agentId, sessionUserId), eq(devicesTable.status, "active")));

  const now = new Date();
  const dayStart = new Date(now); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999);

  const day = now.getDay();
  const diff = (day + 6) % 7;
  const wStart = new Date(now);
  wStart.setDate(now.getDate() - diff);
  wStart.setHours(0,0,0,0);

  const [todaySales] = await db.select({ count: sql<number>`count(*)::int` }).from(devicesTable)
    .where(and(eq(devicesTable.agentId, sessionUserId), gte(devicesTable.dateAdded, dayStart), lte(devicesTable.dateAdded, dayEnd)));

  const [weeklySales] = await db.select({ count: sql<number>`count(*)::int` }).from(devicesTable)
    .where(and(eq(devicesTable.agentId, sessionUserId), gte(devicesTable.dateAdded, wStart), lte(devicesTable.dateAdded, dayEnd)));

  const dailyRanking = await db
    .select({ agentId: devicesTable.agentId, devicesCount: sql<number>`count(*)::int` })
    .from(devicesTable)
    .where(and(gte(devicesTable.dateAdded, dayStart), lte(devicesTable.dateAdded, dayEnd), eq(devicesTable.status, "active")))
    .groupBy(devicesTable.agentId)
    .orderBy(sql`count(*) desc`);

  const myRank = dailyRanking.findIndex(r => r.agentId === sessionUserId);

  res.json({
    myDevices: myDevices?.count ?? 0,
    todaySales: todaySales?.count ?? 0,
    weeklySales: weeklySales?.count ?? 0,
    rankToday: myRank >= 0 ? myRank + 1 : null,
  });
});

export default router;

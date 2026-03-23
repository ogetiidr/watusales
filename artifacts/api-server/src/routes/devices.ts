import { Router } from "express";
import { db, devicesTable, usersTable, blacklistTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { logAction, createNotification } from "../lib/log";

const router = Router();

router.use(requireAuth);

router.get("/search", async (req, res) => {
  const { imei } = req.query as { imei: string };
  if (!imei) { res.status(400).json({ error: "imei required" }); return; }

  const [device] = await db.select().from(devicesTable).where(ilike(devicesTable.imei, imei)).limit(1);
  if (!device) { res.status(404).json({ error: "Device not found" }); return; }

  const agent = device.agentId
    ? (await db.select({ id: usersTable.id, name: usersTable.name, username: usersTable.username, role: usersTable.role, status: usersTable.status, leaderId: usersTable.leaderId, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, device.agentId)).limit(1))[0] ?? null
    : null;
  const leader = device.leaderId
    ? (await db.select({ id: usersTable.id, name: usersTable.name, username: usersTable.username, role: usersTable.role, status: usersTable.status, leaderId: usersTable.leaderId, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, device.leaderId)).limit(1))[0] ?? null
    : null;

  res.json({
    device: {
      ...device,
      agentName: agent?.name ?? null,
      leaderName: leader?.name ?? null,
    },
    agent,
    leader,
  });
});

router.get("/", async (req, res) => {
  const { agentId, leaderId, status } = req.query as any;
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  let where: any[] = [];
  if (agentId) where.push(eq(devicesTable.agentId, parseInt(agentId)));
  if (leaderId) where.push(eq(devicesTable.leaderId, parseInt(leaderId)));
  if (status) where.push(eq(devicesTable.status, status));

  if (sessionRole === "agent") {
    where.push(eq(devicesTable.agentId, sessionUserId));
  } else if (sessionRole === "leader") {
    where.push(eq(devicesTable.leaderId, sessionUserId));
  }

  const devices = await db.select().from(devicesTable).where(where.length ? and(...where) : undefined);

  const agentIds = [...new Set(devices.map(d => d.agentId).filter(Boolean))];
  const leaderIds = [...new Set(devices.map(d => d.leaderId).filter(Boolean))];
  const allIds = [...new Set([...agentIds, ...leaderIds])];

  const usersMap = new Map<number, string>();
  if (allIds.length) {
    const us = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    us.forEach(u => usersMap.set(u.id, u.name));
  }

  const result = devices.map(d => ({
    ...d,
    agentName: d.agentId ? (usersMap.get(d.agentId) ?? null) : null,
    leaderName: d.leaderId ? (usersMap.get(d.leaderId) ?? null) : null,
  }));

  res.json(result);
});

router.post("/", requireRole("agent", "leader", "admin"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const sessionRole = (req as any).session?.role;
  const { imei } = req.body;

  if (!imei) { res.status(400).json({ error: "imei required" }); return; }

  const bl = await db.select().from(blacklistTable).where(eq(blacklistTable.imei, imei)).limit(1);
  if (bl.length) {
    res.status(409).json({ error: "IMEI is blacklisted" });
    return;
  }

  const existing = await db.select().from(devicesTable).where(eq(devicesTable.imei, imei)).limit(1);
  if (existing.length) {
    const ex = existing[0];
    const owner = ex.agentId
      ? (await db.select({ id: usersTable.id, name: usersTable.name, username: usersTable.username, role: usersTable.role, status: usersTable.status, leaderId: usersTable.leaderId, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, ex.agentId)).limit(1))[0] ?? null
      : null;
    res.status(409).json({ error: "IMEI already exists", imei, currentOwner: owner, device: { ...ex, agentName: owner?.name ?? null, leaderName: null } });
    return;
  }

  const requestedAgentId = req.body.agentId ? parseInt(req.body.agentId) : null;

  let resolvedAgentId: number | null = null;
  let resolvedLeaderId: number | null = null;

  if (sessionRole === "agent") {
    resolvedAgentId = sessionUserId;
    const agentUser = await db.select().from(usersTable).where(eq(usersTable.id, sessionUserId)).limit(1);
    resolvedLeaderId = agentUser[0]?.leaderId ?? null;
  } else if (sessionRole === "leader") {
    resolvedAgentId = requestedAgentId;
    resolvedLeaderId = sessionUserId;
    if (requestedAgentId) {
      const agentUser = await db.select().from(usersTable).where(eq(usersTable.id, requestedAgentId)).limit(1);
      if (!agentUser.length || agentUser[0].leaderId !== sessionUserId) {
        res.status(403).json({ error: "Agent does not belong to your team" });
        return;
      }
    }
  } else if (sessionRole === "admin") {
    resolvedAgentId = requestedAgentId;
    if (requestedAgentId) {
      const agentUser = await db.select().from(usersTable).where(eq(usersTable.id, requestedAgentId)).limit(1);
      resolvedLeaderId = agentUser[0]?.leaderId ?? null;
    }
  }

  const [device] = await db.insert(devicesTable).values({
    imei,
    agentId: resolvedAgentId,
    leaderId: resolvedLeaderId,
    status: "active",
  }).returning();

  await logAction("add_device", sessionUserId, `Added device with IMEI ${imei}`);

  if (device.leaderId) {
    await createNotification(device.leaderId, "New Device Added", `Agent added a new device: ${imei}`, "device_added");
  }

  res.status(201).json({ ...device, agentName: null, leaderName: null });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [device] = await db.select().from(devicesTable).where(eq(devicesTable.id, id)).limit(1);
  if (!device) { res.status(404).json({ error: "Device not found" }); return; }

  const agentName = device.agentId
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, device.agentId)).limit(1))[0]?.name ?? null
    : null;
  const leaderName = device.leaderId
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, device.leaderId)).limit(1))[0]?.name ?? null
    : null;

  res.json({ ...device, agentName, leaderName });
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  await db.delete(devicesTable).where(eq(devicesTable.id, id));
  await logAction("delete_device", sessionUserId, `Deleted device ${id}`);
  res.json({ success: true, message: "Device deleted" });
});

router.put("/:id/move", requireRole("admin", "leader"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  const { toAgentId } = req.body;

  const toAgent = await db.select().from(usersTable).where(eq(usersTable.id, toAgentId)).limit(1);
  if (!toAgent.length) { res.status(404).json({ error: "Target agent not found" }); return; }

  const newLeaderId = toAgent[0].leaderId ?? null;

  const [device] = await db.update(devicesTable)
    .set({ agentId: toAgentId, leaderId: newLeaderId })
    .where(eq(devicesTable.id, id)).returning();

  await logAction("move_device", sessionUserId, `Moved device ${id} to agent ${toAgentId}`);
  res.json({ ...device, agentName: toAgent[0].name, leaderName: null });
});

router.put("/:id/assign", requireRole("leader", "admin"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const sessionRole = (req as any).session?.role;
  const id = parseInt(req.params.id);
  const { agentId } = req.body;

  const toAgent = await db.select().from(usersTable).where(eq(usersTable.id, agentId)).limit(1);
  if (!toAgent.length) { res.status(404).json({ error: "Agent not found" }); return; }

  const [device] = await db.update(devicesTable)
    .set({ agentId, leaderId: sessionRole === "leader" ? sessionUserId : (toAgent[0].leaderId ?? null) })
    .where(eq(devicesTable.id, id)).returning();

  await logAction("assign_device", sessionUserId, `Assigned device ${id} to agent ${agentId}`);
  res.json({ ...device, agentName: toAgent[0].name, leaderName: null });
});

export default router;

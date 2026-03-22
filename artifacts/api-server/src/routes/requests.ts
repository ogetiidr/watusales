import { Router } from "express";
import { db, requestsTable, devicesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";
import { logAction, createNotification } from "../lib/log";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { status, type } = req.query as any;
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  let where: any[] = [];
  if (status) where.push(eq(requestsTable.status, status));
  if (type) where.push(eq(requestsTable.type, type));

  if (sessionRole === "agent") {
    where.push(eq(requestsTable.fromAgentId, sessionUserId));
  }

  const reqs = await db.select().from(requestsTable).where(where.length ? and(...where) : undefined);

  const userIds = [...new Set([
    ...reqs.map(r => r.fromAgentId),
    ...reqs.map(r => r.toAgentId),
  ].filter(Boolean))];

  const usersMap = new Map<number, string>();
  if (userIds.length) {
    const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    users.forEach(u => usersMap.set(u.id, u.name));
  }

  const deviceIds = [...new Set(reqs.map(r => r.deviceId))];
  const devicesMap = new Map<number, string>();
  if (deviceIds.length) {
    const devices = await db.select({ id: devicesTable.id, imei: devicesTable.imei }).from(devicesTable);
    devices.forEach(d => devicesMap.set(d.id, d.imei));
  }

  res.json(reqs.map(r => ({
    ...r,
    deviceImei: devicesMap.get(r.deviceId) ?? "",
    fromAgentName: r.fromAgentId ? (usersMap.get(r.fromAgentId) ?? null) : null,
    toAgentName: r.toAgentId ? (usersMap.get(r.toAgentId) ?? null) : null,
  })));
});

router.post("/", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const { type, deviceId, toAgentId } = req.body;

  if (!type || !deviceId) { res.status(400).json({ error: "type and deviceId required" }); return; }

  const device = await db.select().from(devicesTable).where(eq(devicesTable.id, deviceId)).limit(1);
  if (!device.length) { res.status(404).json({ error: "Device not found" }); return; }

  const [request] = await db.insert(requestsTable).values({
    type, deviceId, fromAgentId: sessionUserId,
    toAgentId: toAgentId ?? null, status: "pending",
  }).returning();

  await logAction("create_request", sessionUserId, `Created ${type} request for device ${deviceId}`);

  const leaderId = device[0].leaderId;
  if (leaderId) {
    await createNotification(leaderId, "New Request", `An agent has a pending ${type} request`, "request_pending");
  }

  const imei = device[0].imei;
  res.status(201).json({
    ...request,
    deviceImei: imei,
    fromAgentName: null,
    toAgentName: null,
  });
});

router.put("/:id/approve", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);

  const [request] = await db.select().from(requestsTable).where(eq(requestsTable.id, id)).limit(1);
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  if (request.type === "delete") {
    await db.update(devicesTable).set({ status: "removed" }).where(eq(devicesTable.id, request.deviceId));
  } else if (request.type === "transfer" && request.toAgentId) {
    const toAgent = await db.select().from(usersTable).where(eq(usersTable.id, request.toAgentId)).limit(1);
    await db.update(devicesTable).set({
      agentId: request.toAgentId,
      leaderId: toAgent[0]?.leaderId ?? null,
    }).where(eq(devicesTable.id, request.deviceId));
  }

  const [updated] = await db.update(requestsTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(requestsTable.id, id)).returning();

  await logAction("approve_request", sessionUserId, `Approved request ${id}`);

  if (request.fromAgentId) {
    await createNotification(request.fromAgentId, "Request Approved", `Your ${request.type} request has been approved`, "request_approved");
  }

  const device = await db.select({ imei: devicesTable.imei }).from(devicesTable).where(eq(devicesTable.id, updated.deviceId)).limit(1);
  res.json({ ...updated, deviceImei: device[0]?.imei ?? "", fromAgentName: null, toAgentName: null });
});

router.put("/:id/reject", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  const { reason } = req.body;

  const [request] = await db.select().from(requestsTable).where(eq(requestsTable.id, id)).limit(1);
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  const [updated] = await db.update(requestsTable)
    .set({ status: "rejected", rejectionReason: reason ?? null, updatedAt: new Date() })
    .where(eq(requestsTable.id, id)).returning();

  await logAction("reject_request", sessionUserId, `Rejected request ${id}`);

  if (request.fromAgentId) {
    await createNotification(request.fromAgentId, "Request Rejected", `Your ${request.type} request has been rejected`, "request_rejected");
  }

  const device = await db.select({ imei: devicesTable.imei }).from(devicesTable).where(eq(devicesTable.id, updated.deviceId)).limit(1);
  res.json({ ...updated, deviceImei: device[0]?.imei ?? "", fromAgentName: null, toAgentName: null });
});

export default router;

import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { logAction } from "../lib/log";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { role, status } = req.query as any;
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  let where: any[] = [];
  if (role) where.push(eq(usersTable.role, role));
  if (status) where.push(eq(usersTable.status, status));

  if (sessionRole === "leader") {
    if (role === "agent" || !role) {
      where.push(eq(usersTable.leaderId, sessionUserId));
    }
  }

  let users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    username: usersTable.username,
    role: usersTable.role,
    status: usersTable.status,
    leaderId: usersTable.leaderId,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(where.length ? and(...where) : undefined);

  const leadersMap = new Map<number, string>();
  const leaderIds = [...new Set(users.map(u => u.leaderId).filter(Boolean))];
  if (leaderIds.length) {
    const leaders = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    leaders.forEach(l => leadersMap.set(l.id, l.name));
  }

  const result = users.map(u => ({
    ...u,
    leaderName: u.leaderId ? (leadersMap.get(u.leaderId) ?? null) : null,
  }));

  res.json(result);
});

router.post("/", requireRole("admin", "leader"), async (req, res) => {
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;
  const { name, username, password, role, leaderId } = req.body;

  if (!name || !username || !password || !role) {
    res.status(400).json({ error: "name, username, password, role required" });
    return;
  }

  if (sessionRole === "leader" && role !== "agent") {
    res.status(403).json({ error: "Leaders can only create agents" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing.length) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const hashed = hashPassword(password);
  const effectiveLeaderId = sessionRole === "leader" ? sessionUserId : (leaderId ?? null);

  const [user] = await db.insert(usersTable).values({
    name, username, password: hashed, role,
    status: "active",
    leaderId: effectiveLeaderId,
  }).returning();

  await logAction("create_user", sessionUserId, `Created user ${username} with role ${role}`);

  const { password: _pw, ...safeUser } = user;
  res.status(201).json({ ...safeUser, leaderName: null });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.put("/:id", requireRole("admin", "leader"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  const { name, username, leaderId } = req.body;

  const update: any = {};
  if (name) update.name = name;
  if (username) update.username = username;
  if (leaderId !== undefined) update.leaderId = leaderId;

  const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await logAction("update_user", sessionUserId, `Updated user ${id}`);
  const { password: _pw, ...safeUser } = user;
  res.json({ ...safeUser, leaderName: null });
});

router.delete("/:id", requireRole("admin", "leader"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);

  const { devicesTable } = await import("@workspace/db");
  const devices = await db.select().from(devicesTable).where(
    and(eq(devicesTable.agentId, id), ne(devicesTable.status, "removed"))
  );
  if (devices.length) {
    res.status(400).json({ error: "Cannot delete agent with active devices" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  await logAction("delete_user", sessionUserId, `Deleted user ${id}`);
  res.json({ success: true, message: "User deleted" });
});

router.put("/:id/status", requireRole("admin", "leader"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  const { status } = req.body;

  const [user] = await db.update(usersTable).set({ status }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await logAction("update_user_status", sessionUserId, `Changed user ${id} status to ${status}`);
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.post("/:id/reset-password", requireRole("admin"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  const { newPassword } = req.body;
  if (!newPassword) { res.status(400).json({ error: "newPassword required" }); return; }

  const hashed = hashPassword(newPassword);
  const [user] = await db.update(usersTable).set({ password: hashed }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await logAction("reset_password", sessionUserId, `Reset password for user ${id}`);
  res.json({ success: true, message: "Password reset" });
});

router.put("/:id/move-agent", requireRole("admin"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  const { newLeaderId } = req.body;

  const [user] = await db.update(usersTable).set({ leaderId: newLeaderId }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { devicesTable } = await import("@workspace/db");
  await db.update(devicesTable).set({ leaderId: newLeaderId }).where(eq(devicesTable.agentId, id));

  await logAction("move_agent", sessionUserId, `Moved agent ${id} to leader ${newLeaderId}`);
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.patch("/:id/profile", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const sessionRole = (req as any).session?.role;
  const id = parseInt(req.params.id);

  if (sessionRole === "agent" && id !== sessionUserId) {
    res.status(403).json({ error: "Can only update your own profile" });
    return;
  }

  const { name, phone } = req.body;
  const update: any = {};
  if (name) update.name = name;
  if (phone !== undefined) update.phone = phone;

  const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await logAction("update_profile", sessionUserId, `Updated profile for user ${id}`);
  const { password: _pw, ...safeUser } = user;
  res.json({ ...safeUser, leaderName: null });
});

export default router;

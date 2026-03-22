import { Router } from "express";
import { db, blacklistTable, usersTable, devicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { logAction } from "../lib/log";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const entries = await db.select().from(blacklistTable);
  const userIds = [...new Set(entries.map(e => e.addedById).filter(Boolean))];
  const usersMap = new Map<number, string>();
  if (userIds.length) {
    const users = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    users.forEach(u => usersMap.set(u.id, u.name));
  }
  res.json(entries.map(e => ({
    ...e,
    addedByName: e.addedById ? (usersMap.get(e.addedById) ?? "Unknown") : "Unknown",
  })));
});

router.post("/", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const { imei, reason } = req.body;
  if (!imei) { res.status(400).json({ error: "imei required" }); return; }

  const existing = await db.select().from(blacklistTable).where(eq(blacklistTable.imei, imei)).limit(1);
  if (existing.length) { res.status(409).json({ error: "IMEI already blacklisted" }); return; }

  const [entry] = await db.insert(blacklistTable).values({
    imei, reason: reason ?? null, addedById: sessionUserId,
  }).returning();

  await db.update(devicesTable).set({ status: "blacklisted" }).where(eq(devicesTable.imei, imei));
  await logAction("blacklist_imei", sessionUserId, `Blacklisted IMEI ${imei}`);

  const addedByName = (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, sessionUserId)).limit(1))[0]?.name ?? "Unknown";
  res.status(201).json({ ...entry, addedByName });
});

router.delete("/:id", async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const id = parseInt(req.params.id);
  const [entry] = await db.select().from(blacklistTable).where(eq(blacklistTable.id, id)).limit(1);
  if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }

  await db.delete(blacklistTable).where(eq(blacklistTable.id, id));
  await db.update(devicesTable).set({ status: "active" }).where(eq(devicesTable.imei, entry.imei));
  await logAction("remove_blacklist", sessionUserId, `Removed IMEI ${entry.imei} from blacklist`);
  res.json({ success: true, message: "Removed from blacklist" });
});

export default router;

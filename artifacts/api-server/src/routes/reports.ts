import { Router } from "express";
import { db, usersTable, devicesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { format } from "date-fns";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin", "leader"));

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
}

router.get("/agents", async (req, res) => {
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  let agents = await db.select().from(usersTable).where(eq(usersTable.role, "agent"));
  if (sessionRole === "leader") {
    agents = agents.filter(a => a.leaderId === sessionUserId);
  }

  const allLeaders = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(eq(usersTable.role, "leader"));
  const leaderMap = new Map(allLeaders.map(l => [l.id, l.name]));

  const headers = ["ID", "Name", "Username", "Phone", "Team Leader", "Status", "Created At"];
  const rows = agents.map(a => [
    String(a.id), a.name, a.username, a.phone || "", 
    a.leaderId ? (leaderMap.get(a.leaderId) || "") : "",
    a.status, format(new Date(a.createdAt), "yyyy-MM-dd HH:mm:ss")
  ]);

  const csv = toCSV(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="agents_report_${format(new Date(), "yyyy-MM-dd")}.csv"`);
  res.send(csv);
});

router.get("/devices", async (req, res) => {
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  let query = db.select({
    id: devicesTable.id,
    imei: devicesTable.imei,
    status: devicesTable.status,
    agentId: devicesTable.agentId,
    leaderId: devicesTable.leaderId,
    dateAdded: devicesTable.dateAdded,
  }).from(devicesTable);

  const devices = await query;
  const filteredDevices = sessionRole === "leader" 
    ? devices.filter(d => d.leaderId === sessionUserId)
    : devices;

  const allUsers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u.name]));

  const headers = ["ID", "IMEI", "Agent", "Team Leader", "Status", "Date Added"];
  const rows = filteredDevices.map(d => [
    String(d.id), d.imei,
    d.agentId ? (userMap.get(d.agentId) || "") : "",
    d.leaderId ? (userMap.get(d.leaderId) || "") : "",
    d.status, format(new Date(d.dateAdded), "yyyy-MM-dd HH:mm:ss")
  ]);

  const csv = toCSV(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="devices_report_${format(new Date(), "yyyy-MM-dd")}.csv"`);
  res.send(csv);
});

router.get("/performance", async (req, res) => {
  const sessionRole = (req as any).session?.role;
  const sessionUserId = (req as any).session?.userId;

  let agents = await db.select().from(usersTable).where(eq(usersTable.role, "agent"));
  if (sessionRole === "leader") {
    agents = agents.filter(a => a.leaderId === sessionUserId);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);

  const allUsers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u.name]));

  const allDevices = await db.select().from(devicesTable);

  const headers = ["Agent", "Team Leader", "Today's Devices", "Weekly Devices", "Total Devices"];
  const rows = agents.map(a => {
    const myDevices = allDevices.filter(d => d.agentId === a.id);
    const todayCount = myDevices.filter(d => new Date(d.dateAdded) >= today).length;
    const weeklyCount = myDevices.filter(d => new Date(d.dateAdded) >= weekStart).length;
    return [
      a.name,
      a.leaderId ? (userMap.get(a.leaderId) || "") : "",
      String(todayCount), String(weeklyCount), String(myDevices.length)
    ];
  });

  const csv = toCSV(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="performance_report_${format(new Date(), "yyyy-MM-dd")}.csv"`);
  res.send(csv);
});

export default router;

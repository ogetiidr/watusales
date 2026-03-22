import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/auth";
import { logAction } from "../lib/log";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status === "suspended") {
    res.status(403).json({ error: "Account suspended" });
    return;
  }

  const valid = verifyPassword(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req as any).session.userId = user.id;
  (req as any).session.role = user.role;

  await logAction("login", user.id, `User ${user.username} logged in`);

  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser, message: "Login successful" });
});

router.post("/logout", async (req, res) => {
  const userId = (req as any).session?.userId;
  (req as any).session.destroy?.(() => {});
  if (userId) await logAction("logout", userId, "User logged out");
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.post("/change-password", async (req, res) => {
  const userId = (req as any).session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { currentPassword, newPassword } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (!verifyPassword(currentPassword, user.password)) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = hashPassword(newPassword);
  await db.update(usersTable).set({ password: newHash }).where(eq(usersTable.id, userId));
  await logAction("change_password", userId, "User changed their password");
  res.json({ success: true, message: "Password changed" });
});

export default router;

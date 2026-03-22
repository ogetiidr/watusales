import { db, usersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

export async function seedDefaultUsers() {
  try {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
    if (existing.length > 0) {
      return;
    }

    logger.info("No users found — seeding default users...");

    await db.insert(usersTable).values([
      {
        name: "Super Admin",
        username: "admin",
        password: hashPassword("admin123"),
        role: "admin",
        status: "active",
      },
      {
        name: "Team Leader One",
        username: "leader1",
        password: hashPassword("leader123"),
        role: "leader",
        status: "active",
      },
      {
        name: "Agent One",
        username: "agent1",
        password: hashPassword("agent123"),
        role: "agent",
        status: "active",
      },
    ]);

    const [leader] = await db.select({ id: usersTable.id }).from(usersTable)
      .where((await import("drizzle-orm")).eq(usersTable.username, "leader1")).limit(1);
    const [agent] = await db.select({ id: usersTable.id }).from(usersTable)
      .where((await import("drizzle-orm")).eq(usersTable.username, "agent1")).limit(1);

    if (leader && agent) {
      await db.update(usersTable)
        .set({ leaderId: leader.id })
        .where((await import("drizzle-orm")).eq(usersTable.id, agent.id));
    }

    logger.info("Default users seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed default users");
  }
}

import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./logger";

export async function ensureSessionTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);
  } catch (err) {
    logger.error({ err }, "Failed to ensure session table");
  }
}

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
      .where(eq(usersTable.username, "leader1")).limit(1);
    const [agent] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.username, "agent1")).limit(1);

    if (leader && agent) {
      await db.update(usersTable)
        .set({ leaderId: leader.id })
        .where(eq(usersTable.id, agent.id));
    }

    logger.info("Default users seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed default users");
  }
}

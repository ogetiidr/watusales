import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database...");

  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.username, "admin")).limit(1);
  if (!existingAdmin.length) {
    await db.insert(usersTable).values({
      name: "Super Admin",
      username: "admin",
      password: hashPassword("admin123"),
      role: "admin",
      status: "active",
      leaderId: null,
    });
    console.log("Created admin user: admin / admin123");
  } else {
    console.log("Admin already exists");
  }

  const existingLeader = await db.select().from(usersTable).where(eq(usersTable.username, "leader1")).limit(1);
  let leaderId: number | undefined;
  if (!existingLeader.length) {
    const [leader] = await db.insert(usersTable).values({
      name: "Team Leader One",
      username: "leader1",
      password: hashPassword("leader123"),
      role: "leader",
      status: "active",
      leaderId: null,
    }).returning({ id: usersTable.id });
    leaderId = leader.id;
    console.log("Created leader: leader1 / leader123");
  } else {
    leaderId = existingLeader[0].id;
    console.log("Leader already exists");
  }

  const existingAgent = await db.select().from(usersTable).where(eq(usersTable.username, "agent1")).limit(1);
  if (!existingAgent.length) {
    await db.insert(usersTable).values({
      name: "Agent One",
      username: "agent1",
      password: hashPassword("agent123"),
      role: "agent",
      status: "active",
      leaderId: leaderId ?? null,
    });
    console.log("Created agent: agent1 / agent123");
  } else {
    console.log("Agent already exists");
  }

  console.log("\nSeed complete!");
  console.log("Login credentials:");
  console.log("  Admin:  admin / admin123");
  console.log("  Leader: leader1 / leader123");
  console.log("  Agent:  agent1 / agent123");

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

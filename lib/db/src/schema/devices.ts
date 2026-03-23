import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const deviceStatusEnum = pgEnum("device_status", ["active", "pending", "removed", "blacklisted"]);

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  imei: text("imei").notNull().unique(),
  model: text("model"),
  agentId: integer("agent_id").references(() => usersTable.id, { onDelete: "set null" }),
  leaderId: integer("leader_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: deviceStatusEnum("status").notNull().default("active"),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, dateAdded: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;

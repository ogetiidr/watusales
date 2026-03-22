import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { devicesTable } from "./devices";

export const requestTypeEnum = pgEnum("request_type", ["delete", "transfer"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

export const requestsTable = pgTable("requests", {
  id: serial("id").primaryKey(),
  type: requestTypeEnum("type").notNull(),
  deviceId: integer("device_id").references(() => devicesTable.id, { onDelete: "cascade" }).notNull(),
  fromAgentId: integer("from_agent_id").references(() => usersTable.id, { onDelete: "set null" }),
  toAgentId: integer("to_agent_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: requestStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requestsTable.$inferSelect;

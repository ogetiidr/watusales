import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { logAction } from "../lib/log";

const router = Router();

router.use(requireAuth);

const DEFAULTS: Record<string, string> = {
  imeiScanEnabled: "true",
  enforceMode1: "false",
  agentsCanDeleteDevices: "false",
  leadersCanAddDevices: "true",
};

async function getSettingValue(key: string): Promise<string> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  return row?.value ?? DEFAULTS[key] ?? "false";
}

router.get("/", async (req, res) => {
  const keys = Object.keys(DEFAULTS);
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.key] = r.value; });

  const settings = {
    imeiScanEnabled: (map["imeiScanEnabled"] ?? DEFAULTS["imeiScanEnabled"]) === "true",
    enforceMode1: (map["enforceMode1"] ?? DEFAULTS["enforceMode1"]) === "true",
    agentsCanDeleteDevices: (map["agentsCanDeleteDevices"] ?? DEFAULTS["agentsCanDeleteDevices"]) === "true",
    leadersCanAddDevices: (map["leadersCanAddDevices"] ?? DEFAULTS["leadersCanAddDevices"]) === "true",
  };
  res.json(settings);
});

router.put("/", requireRole("admin", "leader"), async (req, res) => {
  const sessionUserId = (req as any).session?.userId;
  const { imeiScanEnabled, enforceMode1, agentsCanDeleteDevices, leadersCanAddDevices } = req.body;

  const updates: Record<string, string> = {};
  if (imeiScanEnabled !== undefined) updates["imeiScanEnabled"] = String(imeiScanEnabled);
  if (enforceMode1 !== undefined) updates["enforceMode1"] = String(enforceMode1);
  if (agentsCanDeleteDevices !== undefined) updates["agentsCanDeleteDevices"] = String(agentsCanDeleteDevices);
  if (leadersCanAddDevices !== undefined) updates["leadersCanAddDevices"] = String(leadersCanAddDevices);

  for (const [key, value] of Object.entries(updates)) {
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
    if (existing.length) {
      await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key));
    } else {
      await db.insert(settingsTable).values({ key, value });
    }
  }

  await logAction("update_settings", sessionUserId, `Updated system settings`);

  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.key] = r.value; });

  res.json({
    imeiScanEnabled: (map["imeiScanEnabled"] ?? DEFAULTS["imeiScanEnabled"]) === "true",
    enforceMode1: (map["enforceMode1"] ?? DEFAULTS["enforceMode1"]) === "true",
    agentsCanDeleteDevices: (map["agentsCanDeleteDevices"] ?? DEFAULTS["agentsCanDeleteDevices"]) === "true",
    leadersCanAddDevices: (map["leadersCanAddDevices"] ?? DEFAULTS["leadersCanAddDevices"]) === "true",
  });
});

export default router;

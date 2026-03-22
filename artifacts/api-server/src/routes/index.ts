import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import devicesRouter from "./devices";
import blacklistRouter from "./blacklist";
import requestsRouter from "./requests";
import performanceRouter from "./performance";
import logsRouter from "./logs";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/devices", devicesRouter);
router.use("/blacklist", blacklistRouter);
router.use("/requests", requestsRouter);
router.use("/performance", performanceRouter);
router.use("/logs", logsRouter);
router.use("/notifications", notificationsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/settings", settingsRouter);
router.use("/reports", reportsRouter);

export default router;

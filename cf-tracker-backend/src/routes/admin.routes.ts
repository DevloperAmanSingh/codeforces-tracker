import { Router, RequestHandler } from "express";
import {
  getCronSettings,
  updateCronSettings,
  triggerManualSync,
} from "../controllers/admin.controller";

const router = Router();

router.get("/cron-settings", getCronSettings as RequestHandler);
router.put("/cron-settings", updateCronSettings as RequestHandler);
router.post("/manual-sync", triggerManualSync as RequestHandler);

export default router;

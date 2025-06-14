import { Router } from "express";
import {
  getContestHistory,
  getProblemStats,
} from "../controllers/analytics.controller";

const router = Router();

router.get("/:id/contest-history", getContestHistory);
router.get("/:id/problem-stats", getProblemStats);

export default router;

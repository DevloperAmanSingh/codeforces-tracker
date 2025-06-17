import { Router } from "express";
import {
  getContestHistory,
  getProblemStats,
  getRatingDistributionStats,
} from "../controllers/analytics.controller";

const router = Router();

router.get("/:id/contest-history", getContestHistory);
router.get("/:id/problem-stats", getProblemStats);
router.get("/:id/rating-distribution", getRatingDistributionStats);

export default router;

import { RequestHandler, Router } from "express";
import { syncCodeforcesAnalytics } from "../controllers/sync.controller";

const router = Router();

router.post("/codeforces", syncCodeforcesAnalytics as RequestHandler);

export default router;
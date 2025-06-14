import { Request, Response } from "express";
import { syncContestHistory } from "../services/cf.service";

export const syncCodeforcesAnalytics = async (req: Request, res: Response) => {
  const { handle, studentId } = req.body;

  if (!handle || !studentId) {
    return res.status(400).json({ error: "Missing handle or studentId" });
  }

  try {
    await syncContestHistory(handle, studentId);
    res.json({ message: "Contest history synced successfully" });
  } catch (e) {
    res
      .status(500)
      .json({
        error: "Failed to sync Codeforces data",
        details: (e as Error).message,
      });
  }
};

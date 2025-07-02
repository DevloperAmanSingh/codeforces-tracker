import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  initScheduler,
  rescheduleCron,
  manualRun,
} from "../services/scheduler.service";

export const getCronSettings = async (_: Request, res: Response) => {
  const settings = await prisma.adminSettings.findFirst();
  res.json(settings || { cronExpression: "0 2 * * *", enabled: true });
};

export const updateCronSettings = async (req: Request, res: Response) => {
  const { cronExpression, enabled } = req.body;
  if (!cronExpression) {
    return res.status(400).json({ error: "cronExpression is required" });
  }

  rescheduleCron(cronExpression, enabled !== false);

  const isEnabled = enabled || true;

  res.json({
    message: "Cron schedule updated",
    cronExpression,
    enabled: isEnabled,
  });
};

export const triggerManualSync = async (_: Request, res: Response) => {
  manualRun();
  res.json({ message: "Manual sync completed" });
};

initScheduler();

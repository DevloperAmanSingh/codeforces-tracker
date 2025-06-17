import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { subDays } from "date-fns";
import {
  getProblemSolvingStats,
  getRatingDistribution,
} from "../services/cf.service";

export const getContestHistory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  const since = subDays(new Date(), days);

  const contests = await prisma.contestHistory.findMany({
    where: {
      studentId: id,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: "asc" },
  });
  const ratingGraph = contests.map((c) => ({
    date: c.timestamp,
    rating: c.newRating,
  }));
  const contestList = contests.map((c) => ({
    name: c.contestName,
    contestId: c.contestId,
    rank: c.rank,
    oldRating: c.oldRating,
    newRating: c.newRating,
    ratingChange: c.ratingChange,
    unsolvedCount: c.unsolvedCount,
    date: c.timestamp,
  }));
  res.json({
    studentId: id,
    fromDate: since,
    toDate: new Date(),
    ratingGraph,
    contests: contestList,
  });
};

export const getProblemStats = async (req: Request, res: Response) => {
  const { id } = req.params;
  const days = req.query.days ? parseInt(req.query.days as string) : undefined;

  try {
    const stats = await getProblemSolvingStats(id, days);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch problem solving stats" });
  }
};

export const getRatingDistributionStats = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const days = req.query.days ? parseInt(req.query.days as string) : undefined;

  try {
    const stats = await getRatingDistribution(id, days);
    res.json(stats);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch rating distribution stats" });
  }
};

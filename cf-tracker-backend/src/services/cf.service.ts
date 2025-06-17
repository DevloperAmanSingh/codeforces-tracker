import axios from "axios";
import { prisma } from "../lib/prisma";
import { validateCodeforcesHandle } from "../utils/cf";
import {
  RatingChange,
  Submission,
  ContestHistoryData,
  ProblemSolvedData,
  ProblemSolvingStats,
} from "../types/codeforces";

export const syncContestHistory = async (handle: string, studentId: string) => {
  try {
    // Validate Codeforces handle
    const isValid = await validateCodeforcesHandle(handle);
    if (!isValid) {
      throw new Error("Invalid Codeforces handle");
    }

    // Fetch rating changes and submissions from Codeforces API
    const [ratingRes, submissionsRes] = await Promise.all([
      axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`),
      axios.get(`https://codeforces.com/api/user.status?handle=${handle}`),
    ]);

    // Validate API responses
    if (ratingRes.data.status !== "OK") {
      throw new Error(
        `Failed to fetch rating history: ${
          ratingRes.data.comment || "Unknown error"
        }`
      );
    }
    if (submissionsRes.data.status !== "OK") {
      throw new Error(
        `Failed to fetch submissions: ${
          submissionsRes.data.comment || "Unknown error"
        }`
      );
    }

    const ratingChanges: RatingChange[] = ratingRes.data.result || [];
    const submissions: Submission[] = submissionsRes.data.result || [];

    // Process contest history data
    const contestHistoryData = processContestHistory(
      studentId,
      ratingChanges,
      submissions
    );

    // Process problem solving data
    const problemSolvingData = processProblemSolvingData(
      studentId,
      submissions
    );

    // Save to database
    await Promise.all([
      saveContestHistory(studentId, contestHistoryData),
      saveProblemSolvingData(studentId, problemSolvingData),
      updateStudentRatings(studentId, ratingChanges),
    ]);

    console.log(
      `Successfully synced contest history and problem solving data for user: ${handle}`
    );
    return {
      success: true,
      message: `Contest history and problem solving data synced successfully for ${handle}`,
      contestCount: contestHistoryData.length,
      problemsSolved: problemSolvingData.length,
    };
  } catch (error) {
    console.error(`Error syncing data for user ${handle}:`, error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API Error: ${error.response?.data?.comment || error.message}`
      );
    }
    throw error instanceof Error
      ? error
      : new Error("Unknown error occurred during sync");
  }
};

const processContestHistory = (
  studentId: string,
  ratingChanges: RatingChange[],
  submissions: Submission[]
): ContestHistoryData[] => {
  // Track unique contests to avoid duplicates
  const seenContests = new Set<number>();

  const oneYearAgoSec = Math.floor(
    (Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000
  );

  const contestEntries: ContestHistoryData[] = ratingChanges
    .filter((entry) => {
      if (entry.ratingUpdateTimeSeconds < oneYearAgoSec) return false; // only last 365 days
      if (seenContests.has(entry.contestId)) return false;
      seenContests.add(entry.contestId);
      return true;
    })
    .map((entry) => {
      const unsolvedCount = calculateUnsolvedProblems(
        submissions,
        entry.contestId
      );

      return {
        studentId,
        contestName: entry.contestName,
        contestId: entry.contestId.toString(),
        rank: entry.rank,
        oldRating: entry.oldRating,
        newRating: entry.newRating,
        ratingChange: entry.newRating - entry.oldRating,
        unsolvedCount,
        timestamp: new Date(entry.ratingUpdateTimeSeconds * 1000),
      };
    });

  return contestEntries;
};

const processProblemSolvingData = (
  studentId: string,
  submissions: Submission[]
): ProblemSolvedData[] => {
  // Get unique solved problems
  const solvedProblems = new Map<string, Submission>();

  submissions.forEach((sub) => {
    if (sub.verdict === "OK" && sub.problem) {
      const problemKey = `${sub.problem.contestId || "unknown"}-${
        sub.problem.index
      }`;

      // Keep the earliest successful submission for each problem
      if (
        !solvedProblems.has(problemKey) ||
        sub.creationTimeSeconds <
          solvedProblems.get(problemKey)!.creationTimeSeconds
      ) {
        solvedProblems.set(problemKey, sub);
      }
    }
  });

  // Convert to ProblemSolvedData format
  return Array.from(solvedProblems.values()).map((sub) => ({
    studentId,
    problemId: `${sub.problem!.contestId || "unknown"}-${sub.problem!.index}`,
    rating: sub.problem!.rating || null,
    solvedAt: new Date(sub.creationTimeSeconds * 1000),
  }));
};

const saveContestHistory = async (
  studentId: string,
  contestData: ContestHistoryData[]
) => {
  try {
    // Clean previous contest history for this student
    await prisma.contestHistory.deleteMany({ where: { studentId } });

    // Insert new contest history data
    if (contestData.length > 0) {
      await prisma.contestHistory.createMany({ data: contestData });
    }
  } catch (error) {
    console.error("Error saving contest history to database:", error);
    throw new Error("Failed to save contest history to database");
  }
};

const saveProblemSolvingData = async (
  studentId: string,
  problemData: ProblemSolvedData[]
) => {
  try {
    // Clean previous problem solving data for this student
    await prisma.problemSolved.deleteMany({ where: { studentId } });

    // Insert new problem solving data
    if (problemData.length > 0) {
      await prisma.problemSolved.createMany({ data: problemData });
    }
  } catch (error) {
    console.error("Error saving problem solving data to database:", error);
    throw new Error("Failed to save problem solving data to database");
  }
};

const calculateUnsolvedProblems = (
  submissions: Submission[],
  contestId: number
): number => {
  const problemsAttempted = new Set<string>();
  const problemsSolved = new Set<string>();

  submissions.forEach((sub) => {
    if (sub.contestId === contestId && sub.problem?.index) {
      const problemIndex = sub.problem.index;
      problemsAttempted.add(problemIndex);

      if (sub.verdict === "OK") {
        problemsSolved.add(problemIndex);
      }
    }
  });

  return problemsAttempted.size - problemsSolved.size;
};

// Utility function to get problem solving stats with date filtering
export const getProblemSolvingStats = async (
  studentId: string,
  days?: number
): Promise<ProblemSolvingStats> => {
  try {
    const toDate = new Date();
    const fromDate = new Date();
    if (days) {
      fromDate.setDate(fromDate.getDate() - days);
    } else {
      // If no days specified, get all time data
      fromDate.setFullYear(2000); // Set to a very old date
    }

    const whereClause: any = {
      studentId,
      solvedAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    const problemsSolved = await prisma.problemSolved.findMany({
      where: whereClause,
      orderBy: { solvedAt: "desc" },
    });

    // Calculate stats
    const totalProblemsSolved = problemsSolved.length;

    // Most difficult problem (highest rating)
    const mostDifficultProblem =
      problemsSolved
        .filter((p) => p.rating !== null)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null;

    // Average rating (excluding null ratings)
    const problemsWithRating = problemsSolved.filter((p) => p.rating !== null);
    const averageRating =
      problemsWithRating.length > 0
        ? problemsWithRating.reduce((sum, p) => sum + (p.rating || 0), 0) /
          problemsWithRating.length
        : null;

    // Average problems per day
    const daysDiff =
      days ||
      Math.ceil(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    const averageProblemsPerDay = totalProblemsSolved / Math.max(daysDiff, 1);

    return {
      studentId,
      fromDate,
      toDate,
      totalProblemsSolved,
      mostDifficultProblem: mostDifficultProblem
        ? {
            problemId: mostDifficultProblem.problemId,
            rating: mostDifficultProblem.rating,
          }
        : null,
      averageRating: averageRating ? Math.round(averageRating) : null,
      averageProblemsPerDay: Math.round(averageProblemsPerDay * 100) / 100,
    };
  } catch (error) {
    console.error("Error fetching problem solving stats:", error);
    throw new Error("Failed to fetch problem solving stats from database");
  }
};

const updateStudentRatings = async (
  studentId: string,
  ratingChanges: RatingChange[]
) => {
  if (ratingChanges.length === 0) return;
  const currentRating = ratingChanges[ratingChanges.length - 1].newRating;
  const maxRating = ratingChanges.reduce(
    (max, entry) => Math.max(max, entry.newRating),
    0
  );
  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        currentRating,
        maxRating,
      },
    });
  } catch (error) {
    console.error(`Failed to update ratings for student ${studentId}:`, error);
  }
};

// Utility function to get rating distribution stats
export const getRatingDistribution = async (
  studentId: string,
  days?: number
) => {
  try {
    const toDate = new Date();
    const fromDate = new Date();
    if (days) {
      fromDate.setDate(fromDate.getDate() - days);
    } else {
      fromDate.setFullYear(2000); // Set to a very old date for all time
    }

    const whereClause: any = {
      studentId,
      solvedAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    const problemsSolved = await prisma.problemSolved.findMany({
      where: whereClause,
      select: { rating: true },
    });

    // Initialize rating ranges
    const ratingRanges = [
      { range: "< 800", min: 0, max: 799, count: 0 },
      { range: "800-899", min: 800, max: 899, count: 0 },
      { range: "900-999", min: 900, max: 999, count: 0 },
      { range: "1000-1099", min: 1000, max: 1099, count: 0 },
      { range: "1100-1199", min: 1100, max: 1199, count: 0 },
      { range: "1200-1299", min: 1200, max: 1299, count: 0 },
      { range: "1300-1399", min: 1300, max: 1399, count: 0 },
      { range: "1400-1499", min: 1400, max: 1499, count: 0 },
      { range: "1500-1599", min: 1500, max: 1599, count: 0 },
      { range: "1600-1699", min: 1600, max: 1699, count: 0 },
      { range: "1700-1799", min: 1700, max: 1799, count: 0 },
      { range: "1800-1899", min: 1800, max: 1899, count: 0 },
      { range: "1900-1999", min: 1900, max: 1999, count: 0 },
      { range: "2000-2099", min: 2000, max: 2099, count: 0 },
      { range: "2100-2199", min: 2100, max: 2199, count: 0 },
      { range: "2200-2299", min: 2200, max: 2299, count: 0 },
      { range: "2300-2399", min: 2300, max: 2399, count: 0 },
      { range: "2400-2499", min: 2400, max: 2499, count: 0 },
      { range: "2500-2599", min: 2500, max: 2599, count: 0 },
      { range: "2600-2699", min: 2600, max: 2699, count: 0 },
      { range: "2700-2799", min: 2700, max: 2799, count: 0 },
      { range: "2800-2899", min: 2800, max: 2899, count: 0 },
      { range: "2900-2999", min: 2900, max: 2999, count: 0 },
      { range: ">= 3000", min: 3000, max: 9999, count: 0 },
      { range: "Unrated", min: null, max: null, count: 0 },
    ];

    // Count problems in each range
    problemsSolved.forEach((problem) => {
      const rating = problem.rating;

      if (rating === null) {
        ratingRanges[ratingRanges.length - 1].count++; // Unrated
      } else {
        const rangeIndex = ratingRanges.findIndex((range) => {
          if (range.min === null) return false;
          if (range.max === 9999) return rating >= range.min; // >= 3000 case
          return rating >= range.min && rating <= range.max;
        });

        if (rangeIndex !== -1) {
          ratingRanges[rangeIndex].count++;
        }
      }
    });

    // Filter out ranges with 0 problems for cleaner response
    const nonEmptyRanges = ratingRanges.filter((range) => range.count > 0);

    return {
      studentId,
      fromDate,
      toDate,
      totalProblems: problemsSolved.length,
      ratingDistribution: nonEmptyRanges.map((range) => ({
        range: range.range,
        count: range.count,
        percentage: Math.round((range.count / problemsSolved.length) * 100),
      })),
    };
  } catch (error) {
    console.error("Error fetching rating distribution:", error);
    throw new Error("Failed to fetch rating distribution from database");
  }
};

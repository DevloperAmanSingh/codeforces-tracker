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

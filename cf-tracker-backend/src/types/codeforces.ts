// Types for Codeforces API responses
export interface RatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface Submission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem?: {
    contestId?: number;
    index: string;
    name: string;
    rating?: number;
  };
  verdict: string;
}

export interface ContestHistoryData {
  studentId: string;
  contestName: string;
  contestId: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingChange: number;
  unsolvedCount: number;
  timestamp: Date;
}

export interface ProblemSolvedData {
  studentId: string;
  problemId: string;
  rating: number | null;
  solvedAt: Date;
}

export interface ProblemSolvingStats {
  studentId: string;
  fromDate: Date;
  toDate: Date;
  totalProblemsSolved: number;
  mostDifficultProblem: {
    problemId: string;
    rating: number | null;
  } | null;
  averageRating: number | null;
  averageProblemsPerDay: number;
}

const BASE_URL = "http://localhost:3000/api";

// Contest History API
export interface RatingPoint {
  date: string;
  rating: number;
}

export interface Contest {
  name: string;
  contestId: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingChange: number;
  unsolvedCount: number;
  date: string;
}

export interface ContestHistoryResponse {
  studentId: string;
  fromDate: string;
  toDate: string;
  ratingGraph: RatingPoint[];
  contests: Contest[];
}

export const fetchContestHistory = async (
  studentId: string,
  days: string
): Promise<ContestHistoryResponse> => {
  const response = await fetch(
    `${BASE_URL}/analytics/${studentId}/contest-history?days=${days}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch contest history");
  }
  return response.json();
};

// Problem Stats API
export interface ProblemStatsResponse {
  studentId: string;
  fromDate: string;
  toDate: string;
  totalProblemsSolved: number;
  mostDifficultProblem: {
    problemId: string;
    rating: number;
  } | null;
  averageRating: number | null;
  averageProblemsPerDay: number;
}

export const fetchProblemStats = async (
  studentId: string,
  days: string
): Promise<ProblemStatsResponse> => {
  const response = await fetch(
    `${BASE_URL}/analytics/${studentId}/problem-stats?days=${days}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch problem stats");
  }
  return response.json();
};

// Students API
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  cfHandle: string;
  currentRating: number | null;
  maxRating: number | null;
  lastUpdated: string | null;
  autoReminder: boolean;
  remindersSent: number;
}

export const fetchStudents = async (): Promise<Student[]> => {
  const response = await fetch(`${BASE_URL}/students`);
  if (!response.ok) {
    throw new Error("Failed to fetch students");
  }
  return response.json();
};

export const createStudent = async (
  student: Omit<Student, "id" | "lastUpdated" | "remindersSent">
): Promise<Student> => {
  const response = await fetch(`${BASE_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  if (!response.ok) {
    throw new Error("Failed to create student");
  }
  return response.json();
};

export const updateStudent = async (
  id: string,
  student: Omit<Student, "id" | "lastUpdated" | "remindersSent">
): Promise<Student> => {
  const response = await fetch(`${BASE_URL}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  if (!response.ok) {
    throw new Error("Failed to update student");
  }
  return response.json();
};

export const deleteStudent = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/students/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete student");
  }
};

export const updateAutoReminder = async (
  id: string,
  autoReminder: boolean
): Promise<Student> => {
  const response = await fetch(`${BASE_URL}/students/${id}/auto-reminder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ autoReminder }),
  });
  if (!response.ok) {
    throw new Error("Failed to update auto reminder");
  }
  return response.json();
};

// Rating Distribution API
export interface RatingDistributionResponse {
  studentId: string;
  fromDate: string;
  toDate: string;
  totalProblems: number;
  ratingDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export const fetchRatingDistribution = async (
  studentId: string,
  days?: string
): Promise<RatingDistributionResponse> => {
  const url = days
    ? `${BASE_URL}/analytics/${studentId}/rating-distribution?days=${days}`
    : `${BASE_URL}/analytics/${studentId}/rating-distribution`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch rating distribution");
  }
  return response.json();
};

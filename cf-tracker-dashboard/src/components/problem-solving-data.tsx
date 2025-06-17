"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  parseISO,
  subDays,
  startOfDay,
  eachDayOfInterval,
} from "date-fns";
import {
  Loader2,
  Target,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  fetchProblemStats,
  fetchRatingDistribution,
  type ProblemStatsResponse,
  type RatingDistributionResponse,
} from "@/lib/api";

// Extended interface for mock data with additional fields
interface ExtendedProblemStatsResponse extends ProblemStatsResponse {
  ratingDistribution?: RatingDistributionResponse["ratingDistribution"];
  submissionHeatmap?: Array<{
    date: string;
    count: number;
  }>;
}

interface ProblemSolvingDataProps {
  studentId: string;
}

export default function ProblemSolvingData({
  studentId,
}: ProblemSolvingDataProps) {
  const [period, setPeriod] = useState<string>("90");
  const [data, setData] = useState<ExtendedProblemStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [problemStatsResult, ratingDistributionResult] = await Promise.all([
        fetchProblemStats(studentId, period),
        fetchRatingDistribution(studentId, period),
      ]);

      // Generate mock heatmap data for the period (still using mock since API doesn't provide this yet)
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(period) - 1);
      const mockSubmissionHeatmap = eachDayOfInterval({
        start: startOfDay(startDate),
        end: startOfDay(endDate),
      }).map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        count: Math.floor(Math.random() * 8), // Random submissions 0-7
      }));

      const extendedResult: ExtendedProblemStatsResponse = {
        ...problemStatsResult,
        ratingDistribution: ratingDistributionResult.ratingDistribution,
        submissionHeatmap: mockSubmissionHeatmap,
      };

      setData(extendedResult);
    } catch (err) {
      console.error(err);
      setError("Unable to load problem solving data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, studentId]);

  // Generate heatmap calendar
  const generateHeatmapData = () => {
    if (!data?.submissionHeatmap) return [];

    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(period) - 1);
    const dateRange = eachDayOfInterval({
      start: startOfDay(startDate),
      end: startOfDay(endDate),
    });

    const submissionMap = new Map(
      data.submissionHeatmap.map((item) => [
        format(parseISO(item.date), "yyyy-MM-dd"),
        item.count,
      ])
    );

    return dateRange.map((date) => ({
      date: format(date, "yyyy-MM-dd"),
      count: submissionMap.get(format(date, "yyyy-MM-dd")) || 0,
      day: format(date, "EEE"),
      dayOfMonth: format(date, "d"),
    }));
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0)
      return "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
    if (count <= 2)
      return "bg-green-200 dark:bg-green-900 border border-green-300 dark:border-green-800";
    if (count <= 4)
      return "bg-green-300 dark:bg-green-700 border border-green-400 dark:border-green-600";
    if (count <= 6)
      return "bg-green-400 dark:bg-green-600 border border-green-500 dark:border-green-500";
    return "bg-green-500 dark:bg-green-500 border border-green-600 dark:border-green-400";
  };

  const heatmapData = generateHeatmapData();

  return (
    <div className="px-2.5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-cyan-300 bg-clip-text text-transparent font-mono">
            Problem Solving Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive view of your coding journey and progress
          </p>
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-muted-foreground text-lg">
              Loading analytics...
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Most Difficult
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {data.mostDifficultProblem ? (
                      <span>{data.mostDifficultProblem.rating}</span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </p>
                  {data.mostDifficultProblem && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {data.mostDifficultProblem.problemId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="group rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Total Problems
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {data.totalProblemsSolved}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Average Rating
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {data.averageRating
                      ? Math.round(data.averageRating)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Problems/Day
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {data.averageProblemsPerDay.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution Chart */}
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold">
                  Problems by Rating Range
                </h3>
              </div>
              {data.ratingDistribution && data.ratingDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.ratingDistribution}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="range"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [value, "Problems"]}
                      labelFormatter={(label: string) =>
                        `Rating Range: ${label}`
                      }
                      cursor={{ fill: "rgba(30, 41, 59, 0.4)" }}
                      contentStyle={{
                        backgroundColor: "#0f172a", // slate-900
                        border: "1px solid #1e293b", // slate-800
                        borderRadius: "12px",
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                        color: "#f1f5f9", // slate-100
                      }}
                      labelStyle={{
                        color: "#cbd5e1", // slate-300
                        fontWeight: "600",
                        marginBottom: "4px",
                      }}
                      itemStyle={{
                        color: "#3b82f6",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    />
                    <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient
                        id="colorGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1d4ed8"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No rating distribution data available
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Summary Card */}
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-3">
                <div className="p-2 bg-slate-600 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Performance Summary
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Period
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {period === "7"
                        ? "Last 7 days"
                        : period === "30"
                        ? "Last 30 days"
                        : "Last 90 days"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Problems Solved
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xl">
                      {data.totalProblemsSolved}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (data.totalProblemsSolved / 50) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Daily Average
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {data.averageProblemsPerDay.toFixed(1)} problems/day
                    </span>
                  </div>
                </div>

                {data.mostDifficultProblem && (
                  <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          Hardest Problem
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {data.mostDifficultProblem.problemId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          Rating
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {data.mostDifficultProblem.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {data.averageRating && (
                  <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        Average Rating
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {Math.round(data.averageRating)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submission Heatmap */}
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">
                Submission Activity Heatmap
              </h3>
            </div>
            <div className="space-y-4">
              {/* HEATMAP WIDTH CONTROL: Change max-w-4xl to max-w-2xl, max-w-3xl, or max-w-5xl to control width */}
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-16 xl:grid-cols-18 gap-1">
                  {heatmapData.map((day) => (
                    <div
                      key={day.date}
                      className={`w-4 h-4 rounded ${getHeatmapColor(
                        day.count
                      )} relative group cursor-pointer transition-all hover:scale-125 hover:z-10 hover:shadow-lg`}
                      title={`${format(
                        parseISO(day.date + "T00:00:00"),
                        "MMM d, yyyy"
                      )}: ${day.count} submissions`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.count > 0 ? day.count : ""}
                        </span>
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                        {format(parseISO(day.date + "T00:00:00"), "MMM d")}:{" "}
                        {day.count} problems
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground max-w-4xl mx-auto">
                <span className="font-medium">Less</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900 border border-green-300 dark:border-green-800"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700 border border-green-400 dark:border-green-600"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600 border border-green-500 dark:border-green-500"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500 border border-green-600 dark:border-green-400"></div>
                </div>
                <span className="font-medium">More</span>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Total submissions in the last {period} days:{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {heatmapData.reduce((sum, day) => sum + day.count, 0)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

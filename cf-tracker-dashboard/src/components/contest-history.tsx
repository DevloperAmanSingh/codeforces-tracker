"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  BarChart3,
} from "lucide-react";
import { fetchContestHistory, type ContestHistoryResponse } from "@/lib/api";

interface ContestHistoryProps {
  studentId: string;
}

export default function ContestHistory({ studentId }: ContestHistoryProps) {
  const [period, setPeriod] = useState<string>("90");
  const [data, setData] = useState<ContestHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchContestHistory(studentId, period);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Unable to load contest history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, studentId]);

  const getRatingChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getRatingChangeColor = (change: number) => {
    if (change > 0) return "text-green-600 dark:text-green-400";
    if (change < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const formatTooltipDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTableDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return {
        full: format(date, "MMM dd, yyyy"),
        short: format(date, "MMM dd"),
      };
    } catch {
      return { full: dateString, short: dateString };
    }
  };

  return (
    <div className="px-2.5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-cyan-300 bg-clip-text text-transparent font-mono">
            Contest Performance
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your contest performance and rating progression
          </p>
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 365 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-muted-foreground text-lg">
              Loading contest history...
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Rating Chart */}
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Rating Progress</h3>
            </div>
            {data.ratingGraph && data.ratingGraph.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={data.ratingGraph}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      try {
                        return format(parseISO(value), "MMM dd");
                      } catch {
                        return value;
                      }
                    }}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    domain={["dataMin - 50", "dataMax + 50"]}
                  />
                  <Tooltip
                    labelFormatter={(value: string) => {
                      try {
                        return format(parseISO(value), "MMM dd, yyyy");
                      } catch {
                        return value;
                      }
                    }}
                    formatter={(value: number) => [value, "Rating"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      padding: "12px",
                    }}
                    labelStyle={{
                      color: "#374151",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                    itemStyle={{
                      color: "#3b82f6",
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="url(#ratingGradient)"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{
                      r: 6,
                      stroke: "#3b82f6",
                      strokeWidth: 2,
                      fill: "#1d4ed8",
                    }}
                  />
                  <defs>
                    <linearGradient
                      id="ratingGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No rating data available for this period
                </p>
              </div>
            )}
          </div>

          {/* Contest Table */}
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 backdrop-blur-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold flex items-center gap-3">
                <div className="p-2 bg-amber-600 rounded-lg">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                Recent Contests
              </h3>
            </div>
            {data.contests && data.contests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-left">
                      <th className="p-4 font-semibold text-sm text-slate-700 dark:text-slate-300">
                        Contest
                      </th>
                      <th className="p-4 font-semibold text-sm text-center text-slate-700 dark:text-slate-300">
                        Rank
                      </th>
                      <th className="p-4 font-semibold text-sm text-center text-slate-700 dark:text-slate-300">
                        Rating Change
                      </th>
                      <th className="p-4 font-semibold text-sm text-center text-slate-700 dark:text-slate-300">
                        Problems Unsolved
                      </th>
                      <th className="p-4 font-semibold text-sm text-center text-slate-700 dark:text-slate-300">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.contests.map((contest, index) => {
                      const dateFormatted = formatTableDate(contest.date);
                      return (
                        <tr
                          key={contest.contestId || index}
                          className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-sm"
                        >
                          <td className="p-4">
                            <div className="font-medium text-sm truncate max-w-[200px] text-slate-900 dark:text-slate-100">
                              {contest.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              ID: {contest.contestId}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              #{contest.rank}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {getRatingChangeIcon(contest.ratingChange)}
                              <span
                                className={`text-sm font-bold ${getRatingChangeColor(
                                  contest.ratingChange
                                )}`}
                              >
                                {contest.ratingChange > 0 ? "+" : ""}
                                {contest.ratingChange}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                contest.unsolvedCount === 0
                                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                  : "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                              }`}
                            >
                              {contest.unsolvedCount === 0
                                ? "All solved"
                                : `${contest.unsolvedCount} unsolved`}
                            </span>
                          </td>
                          <td className="p-4 text-center text-sm text-slate-600 dark:text-slate-400">
                            <span className="hidden sm:inline">
                              {dateFormatted.full}
                            </span>
                            <span className="sm:hidden">
                              {dateFormatted.short}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <Trophy className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No contests found for this period
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

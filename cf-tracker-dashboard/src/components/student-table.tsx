"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Edit, Trash2, Download, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  fetchProblemStats,
  type Student,
  type ProblemStatsResponse,
} from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { updateAutoReminder } from "@/lib/api";
import { DownloadCSV } from "@/components/download-csv";

interface StudentFormState
  extends Omit<Student, "id" | "lastUpdated" | "remindersSent"> {}

export default function StudentTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentStats, setStudentStats] = useState<
    Record<string, ProblemStatsResponse>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [daysPeriod, setDaysPeriod] = useState("90");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<StudentFormState>({
    name: "",
    email: "",
    phone: "",
    cfHandle: "",
    currentRating: null,
    maxRating: null,
    autoReminder: true,
  });

  const router = useRouter();

  // Fetch students data
  const loadStudents = async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  // Fetch student stats
  const loadStudentStats = async (studentId: string, days: string) => {
    try {
      const data = await fetchProblemStats(studentId, days);
      setStudentStats((prev) => ({ ...prev, [studentId]: data }));
    } catch (error) {
      console.error(`Failed to fetch stats for student ${studentId}:`, error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadStudents();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    // Fetch stats for all students when period changes
    students.forEach((student) => {
      loadStudentStats(student.id, daysPeriod);
    });
  }, [students, daysPeriod]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.cfHandle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormState({
      name: "",
      email: "",
      phone: "",
      cfHandle: "",
      currentRating: null,
      maxRating: null,
      autoReminder: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (
      !formState.name ||
      !formState.email ||
      !formState.phone ||
      !formState.cfHandle
    ) {
      return;
    }

    try {
      if (editingId) {
        // Update existing student
        await updateStudent(editingId, formState);
        await loadStudents();
      } else {
        // Create new student
        await createStudent(formState);
        await loadStudents();
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save student:", error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setFormState({
      name: student.name,
      email: student.email,
      phone: student.phone,
      cfHandle: student.cfHandle,
      currentRating: student.currentRating,
      maxRating: student.maxRating,
      autoReminder: student.autoReminder,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent(id);
      await loadStudents();
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  };

  const handleView = (id: string) => {
    router.push(`/student/${id}`);
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating)
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    if (rating >= 2400)
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    if (rating >= 2100)
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    if (rating >= 1900)
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    if (rating >= 1600)
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    if (rating >= 1400)
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300";
    if (rating >= 1200)
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Student Progress Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Track and manage competitive programming students
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* <select
            value={daysPeriod}
            onChange={(e) => setDaysPeriod(e.target.value)}
            className="w-32 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select> */}
          <DownloadCSV data={students} filename="students.csv" />
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Students Card */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold">
            Students ({filteredStudents.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your competitive programming students and track their
            progress
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Codeforces
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Reminders
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Auto Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  // const stats = studentStats[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {student.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>✉</span>
                            <span>{student.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>📞</span>
                            <span>{student.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground font-mono">
                          {student.cfHandle}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              🏆
                            </span>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getRatingColor(
                                student.currentRating
                              )}`}
                            >
                              {student.currentRating || "Unrated"}
                            </span>
                          </div>
                          {student.maxRating && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                📈
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Max: {student.maxRating}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-muted-foreground">
                          {student.remindersSent}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          checked={student.autoReminder}
                          onCheckedChange={async (checked) => {
                            // optimistic UI update
                            setStudents((prev) =>
                              prev.map((s) =>
                                s.id === student.id
                                  ? { ...s, autoReminder: checked }
                                  : s
                              )
                            );
                            try {
                              await updateAutoReminder(student.id, checked);
                            } catch (err) {
                              console.error(
                                "Failed to toggle auto reminder",
                                err
                              );
                              // revert on failure
                              setStudents((prev) =>
                                prev.map((s) =>
                                  s.id === student.id
                                    ? { ...s, autoReminder: !checked }
                                    : s
                                )
                              );
                            }
                          }}
                          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-400"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(student.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(student.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Student</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formState.email}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                required
                value={formState.phone}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="handle">Codeforces Handle</Label>
              <Input
                id="handle"
                required
                value={formState.cfHandle}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    cfHandle: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex gap-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="current">Current Rating</Label>
                <Input
                  id="current"
                  type="number"
                  value={formState.currentRating || ""}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      currentRating: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>
              <div className="grid flex-1 gap-2">
                <Label htmlFor="max">Max Rating</Label>
                <Input
                  id="max"
                  type="number"
                  value={formState.maxRating || ""}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      maxRating: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

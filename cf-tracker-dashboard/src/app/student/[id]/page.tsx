import { Metadata } from "next";
import { Suspense } from "react";
import ContestHistory from "@/components/contest-history";
import ProblemSolvingData from "@/components/problem-solving-data";

interface StudentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Student Details | Codeforces Tracker",
};

export default async function StudentPage({ params }: StudentPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background px-2.5">
      <div className="py-6 space-y-8">
        <Suspense fallback={<div>Loading contest history...</div>}>
          <ContestHistory studentId={id} />
        </Suspense>

        <Suspense fallback={<div>Loading problem solving data...</div>}>
          <ProblemSolvingData studentId={id} />
        </Suspense>
      </div>
    </div>
  );
}

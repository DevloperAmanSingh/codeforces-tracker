import StudentTable from "@/components/student-table";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <StudentTable />
      </div>
    </div>
  );
}

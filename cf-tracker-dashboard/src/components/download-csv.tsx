import { Button } from "@/components/ui/button";

interface DownloadCSVProps<T extends Record<string, any>> {
  data: T[];
  filename?: string;
}

function convertToCsv<T extends Record<string, any>>(data: T[]) {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((field) => JSON.stringify(row[field] ?? "")).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function DownloadCSV<T extends Record<string, any>>({
  data,
  filename = "students.csv",
}: DownloadCSVProps<T>) {
  const handleDownload = () => {
    const csv = convertToCsv(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      Download CSV
    </Button>
  );
}

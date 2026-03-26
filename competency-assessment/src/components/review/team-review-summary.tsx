"use client";

interface ReviewEntry {
  employee: {
    id: string;
    name: string;
    careerTrack: string;
  };
  selfProgress?: number | null;
  managerProgress?: number | null;
  status: string;
}

interface TeamReviewSummaryProps {
  reviews: ReviewEntry[];
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-700",
  SUBMITTED: "bg-green-100 text-green-700",
  PENDING: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}

export function TeamReviewSummary({ reviews }: TeamReviewSummaryProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No direct reports with pending reviews.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 font-medium text-foreground">Name</th>
            <th className="pb-2 pr-4 font-medium text-foreground">Role</th>
            <th className="pb-2 pr-4 font-medium text-foreground text-center">
              Self Progress
            </th>
            <th className="pb-2 pr-4 font-medium text-foreground text-center">
              Manager Progress
            </th>
            <th className="pb-2 font-medium text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((entry) => (
            <tr
              key={entry.employee.id}
              className="border-b border-border last:border-b-0"
            >
              <td className="py-2 pr-4 text-foreground font-medium">
                {entry.employee.name}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {entry.employee.careerTrack}
              </td>
              <td className="py-2 pr-4 text-center text-muted-foreground">
                {entry.selfProgress != null
                  ? entry.selfProgress.toFixed(1)
                  : "—"}
              </td>
              <td className="py-2 pr-4 text-center text-muted-foreground">
                {entry.managerProgress != null
                  ? entry.managerProgress.toFixed(1)
                  : "—"}
              </td>
              <td className="py-2">
                <StatusBadge status={entry.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

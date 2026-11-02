import type { ReactNode } from "react";

export interface DashboardTableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  className?: string;
}

interface DashboardTableProps<Row> {
  columns: DashboardTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, index: number) => string;
  emptyMessage?: string;
}

export default function DashboardTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No data available.",
}: DashboardTableProps<Row>) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-slate">{emptyMessage}</p>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-start text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-text-slate">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-3 py-3 text-start font-medium first:ps-0 last:pe-0 ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className="border-b border-border-subtle last:border-b-0"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3 py-4 first:ps-0 last:pe-0 ${column.className ?? ""}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

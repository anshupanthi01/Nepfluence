"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"

export type DataTableColumn<T> = {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  page,
  pageSize,
  total,
  onPageChange,
  isLoading = false,
  emptyMessage = "No results.",
  className,
}: DataTableProps<T>) {
  const showPagination =
    page !== undefined && pageSize !== undefined && total !== undefined && Boolean(onPageChange)

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {columns.map((column) => (
                <th key={column.key} className={cn("px-3 py-2 whitespace-nowrap", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="border-b border-border last:border-0 hover:bg-muted/30">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-3 py-2 align-middle", column.className)}>
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <Pagination page={page as number} pageSize={pageSize as number} total={total as number} onPageChange={onPageChange!} />
      )}
    </div>
  )
}

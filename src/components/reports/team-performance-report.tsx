import { Download, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SpreadsheetTable, rowsForExport, type SheetColumn } from '@/components/ui/spreadsheet-table'
import { useTeamPerformance } from '@/hooks/queries/use-leads'
import { exportToCsv } from '@/lib/export-csv'
import { formatCurrency } from '@/lib/utils'
import type { TeamPerformanceRow } from '@/types'

const columns: SheetColumn<TeamPerformanceRow>[] = [
  { id: 'executive', header: 'Executive', accessor: (r) => r.fullName, sticky: true, minWidth: '170px' },
  { id: 'totalLeads', header: 'Total Leads', accessor: (r) => r.totalLeads, align: 'right', minWidth: '110px' },
  { id: 'hotLeads', header: 'Hot Leads', accessor: (r) => r.hotLeads, align: 'right', minWidth: '100px' },
  { id: 'visitsPlanned', header: 'Visits Planned', accessor: (r) => r.visitsPlanned, align: 'right', minWidth: '120px' },
  { id: 'visitsDone', header: 'Visits Done', accessor: (r) => r.visitsDone, align: 'right', minWidth: '110px' },
  { id: 'bookings', header: 'Bookings', accessor: (r) => r.bookings, align: 'right', minWidth: '100px' },
  { id: 'bookingValue', header: 'Booking Value (₹)', accessor: (r) => r.bookingValue, cell: (r) => formatCurrency(r.bookingValue), align: 'right', minWidth: '150px' },
  {
    id: 'overdueFollowUps',
    header: 'Overdue Follow-ups',
    accessor: (r) => r.overdueFollowUps,
    cell: (r) => (r.overdueFollowUps > 0 ? <Badge variant="danger">{r.overdueFollowUps}</Badge> : '0'),
    align: 'right',
    minWidth: '150px',
  },
  { id: 'visitConversionPct', header: 'Visit Conversion %', accessor: (r) => r.visitConversionPct, cell: (r) => `${r.visitConversionPct}%`, align: 'right', minWidth: '150px' },
  { id: 'leadToBookingPct', header: 'Lead-to-Booking %', accessor: (r) => r.leadToBookingPct, cell: (r) => `${r.leadToBookingPct}%`, align: 'right', minWidth: '150px' },
]

export function TeamPerformanceReport() {
  const { data: rows = [], isLoading } = useTeamPerformance()

  const handleExport = () => {
    exportToCsv(`team-performance-${new Date().toISOString().slice(0, 10)}`, columns.map((c) => c.header), rowsForExport(columns, rows))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <SpreadsheetTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        rowKey={(r) => r.userId}
        emptyIcon={UsersRound}
        emptyTitle="No sales executives yet"
        emptyDescription="Add PRESALES/POSTSALES/AGENT team members to see their performance here."
        maxHeight="60vh"
      />
    </div>
  )
}

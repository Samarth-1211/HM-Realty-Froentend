import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Spinner } from '@/components/ui/spinner'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { ImportSummary } from '@/components/leads/import-leads-modal'
import { leadsApi } from '@/api/leads.api'
import { useLeadImport, useLeadImports } from '@/hooks/queries/use-leads'
import { extractErrorMessage } from '@/lib/api-client'
import { downloadBlob } from '@/lib/export-csv'
import { formatDateTime, formatFileSize } from '@/lib/utils'
import { LeadImportStatus, UserRole, type LeadImportBatch } from '@/types'

const PAGE_SIZE = 25

const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`

function collaboratorsLabel(batch: LeadImportBatch): string {
  if (batch.uploadedBy.role !== UserRole.MANAGER) return 'All teams'
  if (batch.collaborators.length === 0) return 'Own team only'
  return batch.collaborators.map(fullName).join(', ')
}

function StatusBadge({ status }: { status: LeadImportBatch['status'] }) {
  if (status === LeadImportStatus.PROCESSING) return <Badge variant="brand">Importing</Badge>
  if (status === LeadImportStatus.FAILED) return <Badge variant="danger">Stopped</Badge>
  return <Badge variant="success">Finished</Badge>
}

/**
 * Admin's history of every lead sheet uploaded in the org — by Admins and
 * Managers: when it came in, who uploaded it, which managers they shared it
 * with (collaborators), how the import went, and the original file to
 * download.
 */
export function LeadUploadsPage() {
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { data, isLoading } = useLeadImports(page, PAGE_SIZE)

  const download = async (batch: LeadImportBatch) => {
    setDownloadingId(batch.id)
    try {
      downloadBlob(await leadsApi.importFile(batch.id), batch.fileName)
    } catch (error) {
      toast.error('Could not download the sheet', { description: extractErrorMessage(error) })
    } finally {
      setDownloadingId(null)
    }
  }

  const columns: Column<LeadImportBatch>[] = [
    {
      key: 'uploaded',
      header: 'Uploaded',
      render: (b) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(b.createdAt)}</span>,
    },
    {
      key: 'file',
      header: 'Sheet',
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800" title={b.fileName}>
            {b.fileName}
          </p>
          <p className="text-xs text-slate-400">
            {b.totalRows.toLocaleString('en-IN')} rows{b.fileSizeBytes ? ` · ${formatFileSize(b.fileSizeBytes)}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'uploadedBy',
      header: 'Uploaded by',
      render: (b) => (
        <div>
          <p className="text-slate-700">{fullName(b.uploadedBy)}</p>
          <p className="text-xs text-slate-400">{b.uploadedBy.role === UserRole.MANAGER ? 'Manager' : 'Admin'}</p>
        </div>
      ),
    },
    {
      key: 'collaborators',
      header: 'Collaborators',
      render: (b) => (
        <span className={b.collaborators.length > 0 ? 'text-slate-700' : 'text-slate-400'}>{collaboratorsLabel(b)}</span>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      render: (b) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={b.status} />
          <p className="whitespace-nowrap text-xs text-slate-500">
            {b.createdCount.toLocaleString('en-IN')} imported · {b.duplicateCount.toLocaleString('en-IN')} duplicate ·{' '}
            {b.failedCount.toLocaleString('en-IN')} failed
          </p>
        </div>
      ),
    },
    {
      key: 'download',
      header: '',
      headerClassName: 'w-10',
      className: 'w-10',
      render: (b) =>
        b.hasFile ? (
          <Button
            variant="ghost"
            size="sm"
            title="Download the uploaded sheet"
            loading={downloadingId === b.id}
            onClick={(e) => {
              e.stopPropagation()
              void download(b)
            }}
          >
            {downloadingId !== b.id && <Download className="size-4" />}
          </Button>
        ) : (
          <span className="text-xs text-slate-300" title="Uploaded before sheets were kept">
            —
          </span>
        ),
    },
  ]

  const selected = data?.items.find((b) => b.id === selectedId) ?? null

  return (
    <div>
      <PageHeader
        title="Lead Uploads"
        description="Every Excel sheet of leads uploaded by Admins and Managers — when, by whom, the managers they collaborated with, and the original file."
      />

      <Card>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          rowKey={(b) => b.id}
          onRowClick={(b) => setSelectedId(b.id)}
          emptyIcon={FileSpreadsheet}
          emptyTitle="No sheets uploaded yet"
          emptyDescription="Sheets uploaded from the Leads page show up here."
        />
        {data && data.total > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        )}
      </Card>

      <UploadDetailModal
        batch={selected}
        onClose={() => setSelectedId(null)}
        onDownload={download}
        downloading={!!selected && downloadingId === selected.id}
      />
    </div>
  )
}

function UploadDetailModal({
  batch,
  onClose,
  onDownload,
  downloading,
}: {
  batch: LeadImportBatch | null
  onClose: () => void
  onDownload: (batch: LeadImportBatch) => void
  downloading: boolean
}) {
  // The list leaves out row-level issues; the single upload has them.
  const { data: full } = useLeadImport(batch?.id ?? null)

  return (
    <Modal open={!!batch} onClose={onClose} title="Lead upload" subtitle={batch?.fileName} size="lg">
      {batch && (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-400">Uploaded</dt>
              <dd className="text-slate-700">{formatDateTime(batch.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Uploaded by</dt>
              <dd className="text-slate-700">
                {fullName(batch.uploadedBy)} ({batch.uploadedBy.role === UserRole.MANAGER ? 'Manager' : 'Admin'})
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-400">Collaborators</dt>
              <dd className="text-slate-700">{collaboratorsLabel(batch)}</dd>
            </div>
          </dl>

          {full && full.status !== LeadImportStatus.PROCESSING ? (
            <ImportSummary batch={full} />
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Spinner className="size-4" />
              {full ? 'Still importing…' : 'Loading…'}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {batch.hasFile && (
              <Button onClick={() => onDownload(batch)} loading={downloading}>
                {!downloading && <Download className="size-4" />}
                Download sheet
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

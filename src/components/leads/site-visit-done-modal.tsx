import { useEffect, useRef, useState } from 'react'
import { Camera, ImageUp } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Label } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateSiteVisit } from '@/hooks/queries/use-leads'
import { useProjects } from '@/hooks/queries/use-projects'
import { useAuthStore } from '@/store/auth-store'
import type { Lead } from '@/types'
import { fromDateTimeParts, toDateTimeParts, VisitDateTimeFields, type DateTimeParts } from './visit-date-time-fields'

/** Longest side of the photo as uploaded — plenty to see the site, and quick on mobile data. */
const MAX_PHOTO_EDGE = 1600
const SENDABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** The server's limit for a visit time ahead of now (a typo, not a visit that happened). */
const FUTURE_TOLERANCE_MS = 60 * 60 * 1000

/**
 * The photo as a JPEG no larger than MAX_PHOTO_EDGE, the right way up.
 * Phone photos are several MB; this keeps the upload small. Falls back to
 * the original when the browser can't redraw it.
 */
async function preparePhoto(file: File): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    if (SENDABLE_TYPES.includes(file.type)) return file
    throw new Error('This photo’s format isn’t supported — take it again, or pick a JPG or PNG.')
  }
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) return file
  const base = file.name.replace(/\.[^.]+$/, '') || 'site-visit'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

/**
 * "Site visit done": who visited which project and when, with one photo
 * from the site. Prefilled from the lead and its assignee; saving it moves
 * the lead to In Progress → Site visit done.
 */
export function SiteVisitDoneModal({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user)
  const { data: projects = [], isPending: projectsLoading } = useProjects(open)
  const create = useCreateSiteVisit()

  const [clientName, setClientName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [visitAt, setVisitAt] = useState<DateTimeParts>(() => toDateTimeParts(new Date()))
  const [clientBy, setClientBy] = useState('')
  const [visitBy, setVisitBy] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  // Each time it opens: the lead's details, now as the time, its assignee as both names.
  useEffect(() => {
    if (!open) return
    const handler = lead.assignedTo ?? currentUser
    const handlerName = handler ? `${handler.firstName} ${handler.lastName}`.trim() : ''
    setClientName(lead.fullName)
    setProjectId(lead.projectId ?? '')
    setVisitAt(toDateTimeParts(new Date()))
    setClientBy(handlerName)
    setVisitBy(handlerName)
    setPhoto(null)
    // Only on opening; later changes to the lead mustn't wipe what's being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!photo) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const pickPhoto = async (input: HTMLInputElement) => {
    const file = input.files?.[0]
    // Cleared so picking the same photo again still counts as a change.
    input.value = ''
    if (!file) return
    setPreparing(true)
    try {
      setPhoto(await preparePhoto(file))
    } catch (error) {
      toast.error('Could not use this photo', { description: (error as Error).message })
    } finally {
      setPreparing(false)
    }
  }

  const visitedAt = fromDateTimeParts(visitAt)
  const inFuture = !!visitedAt && visitedAt.getTime() > Date.now() + FUTURE_TOLERANCE_MS
  const ready =
    !!clientName.trim() && !!projectId && !!visitedAt && !inFuture && !!clientBy.trim() && !!visitBy.trim() && !!photo

  const submit = () => {
    if (!ready || !visitedAt || !photo) return
    create.mutate(
      {
        id: lead.id,
        photo,
        payload: {
          projectId,
          clientName: clientName.trim(),
          visitedAt: visitedAt.toISOString(),
          clientBy: clientBy.trim(),
          visitBy: visitBy.trim(),
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Site visit done" subtitle="Fill in the visit details and add a photo from the site" size="md">
      <div className="flex flex-col gap-4">
        <Field label="Client name" required>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} error={!clientName.trim()} />
        </Field>

        <Field label="Project visited" required>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={projectsLoading}>
            <option value="">{projectsLoading ? 'Loading projects…' : 'Choose a project'}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.id === lead.projectId ? ' (lead’s project)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        <VisitDateTimeFields
          value={visitAt}
          onChange={setVisitAt}
          error={inFuture ? 'The visit can’t be in the future' : undefined}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client by" required hint="Who handled the client">
            <Input value={clientBy} onChange={(e) => setClientBy(e.target.value)} error={!clientBy.trim()} />
          </Field>
          <Field label="Visit by" required hint="Who went on the visit">
            <Input value={visitBy} onChange={(e) => setVisitBy(e.target.value)} error={!visitBy.trim()} />
          </Field>
        </div>

        <div className="flex flex-col">
          <Label>
            Photo from the visit<span className="text-rose-500"> *</span>
          </Label>
          {preview && (
            <img src={preview} alt="Site visit" className="mb-2 max-h-64 w-full rounded-xl bg-slate-100 object-contain" />
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => cameraInput.current?.click()} loading={preparing} disabled={create.isPending}>
              <Camera className="size-4" />
              {photo ? 'Retake' : 'Take photo'}
            </Button>
            <Button variant="outline" onClick={() => galleryInput.current?.click()} disabled={preparing || create.isPending}>
              <ImageUp className="size-4" />
              {photo ? 'Change' : 'From gallery'}
            </Button>
          </div>
          {!photo && <p className="mt-1 text-xs text-slate-400">A photo is required. Take photo opens the camera on a phone.</p>}
          {/* capture opens the camera directly on phones; desktops show a file picker. */}
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickPhoto(e.target)} />
          <input ref={galleryInput} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target)} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending} disabled={!ready || preparing}>
            Update
          </Button>
        </div>
      </div>
    </Modal>
  )
}

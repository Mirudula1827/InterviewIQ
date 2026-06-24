import { useRef, useState } from "react"
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react"

// Upload lifecycle states: "idle" | "uploading" | "success"
export default function ResumeUploader() {
  const inputRef = useRef(null)
  const [status, setStatus] = useState("idle")
  const [fileName, setFileName] = useState("")
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  function handleFiles(files) {
    const file = files?.[0]
    if (!file) return

    setFileName(file.name)
    setStatus("uploading")
    setProgress(0)

    // TODO: Connect to POST /api/resume/upload
    // Simulated upload progress for the mock UI.
    let pct = 0
    const timer = setInterval(() => {
      pct += 12
      if (pct >= 100) {
        clearInterval(timer)
        setProgress(100)
        setStatus("success")
      } else {
        setProgress(pct)
      }
    }, 180)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  function reset() {
    setStatus("idle")
    setFileName("")
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText size={18} className="text-[var(--color-accent)]" />
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Upload Resume
        </h2>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={[
            "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
            dragActive
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
              : "border-border bg-background hover:border-[var(--color-faint)] hover:bg-surface-hover",
          ].join(" ")}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface">
            <UploadCloud size={22} className="text-muted" />
          </span>
          <span className="text-sm font-medium text-foreground">
            Drag &amp; drop your resume here
          </span>
          <span className="text-xs text-faint">
            PDF up to 10MB &middot; or click to browse
          </span>
          <span className="mt-1 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-xs font-semibold text-white">
            Browse Files
          </span>
        </button>
      )}

      {status === "uploading" && (
        <div className="rounded-xl border border-border bg-background px-4 py-4">
          <div className="flex items-center gap-3">
            <Loader2
              size={18}
              className="animate-spin text-[var(--color-accent)]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {fileName}
              </p>
              <p className="text-xs text-faint">Uploading… {progress}%</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <CheckCircle2 size={20} className="text-emerald-400" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {fileName}
            </p>
            <p className="text-xs text-emerald-400">Upload complete</p>
          </div>
          <button
            type="button"
            onClick={reset}
            aria-label="Remove file"
            className="rounded-lg p-2 text-faint outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </section>
  )
}

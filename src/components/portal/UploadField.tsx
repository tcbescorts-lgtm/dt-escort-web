"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX = 10 * 1024 * 1024;

/**
 * Uploads straight from the browser to private Supabase Storage (so large
 * photos don't pass through the server), then puts the stored path into
 * hidden inputs for the surrounding form. Storage RLS limits drivers to their own folder.
 */
export default function UploadField({
  bucket, folder, label, id, required, accept = "application/pdf,image/*", capture,
}: { bucket: "driver-docs" | "run-sheet-files"; folder: string; label: string; id: string; required?: boolean; accept?: string; capture?: boolean }) {
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPath("");
    if (!f) return;
    if (!TYPES.includes(f.type)) return setMsg({ t: "Upload a PDF, JPG, PNG, WEBP or HEIC file.", bad: true });
    if (f.size > MAX) return setMsg({ t: "Files must be 10 MB or smaller.", bad: true });
    setBusy(true);
    setMsg({ t: "Uploading…" });
    const p = `${folder}/${Date.now()}-${f.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80)}`;
    const { error } = await supabaseBrowser().storage.from(bucket).upload(p, f, { contentType: f.type });
    setBusy(false);
    if (error) return setMsg({ t: `Upload failed: ${error.message}`, bad: true });
    setPath(p);
    setName(f.name);
    setMsg({ t: `Uploaded ${f.name}.` });
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span aria-hidden="true" className="text-gold"> *</span>}</label>
      <span id={`${id}-hint`} className="hint">PDF or photo, up to 10 MB.</span>
      <input id={id} type="file" accept={accept} capture={capture ? "environment" : undefined} onChange={onFile} disabled={busy}
        className="input !py-2" aria-describedby={`${id}-hint ${id}-msg`} />
      <input type="hidden" name="file_path" value={path} />
      <input type="hidden" name="file_name" value={name} />
      <p id={`${id}-msg`} aria-live="polite" className={`mt-1 text-sm ${msg?.bad ? "text-error" : "text-muted"}`}>{msg?.t}</p>
    </div>
  );
}

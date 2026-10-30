"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
type F = { path: string; name: string; kind: string };

/** Several receipts/photos for a run sheet, uploaded directly to private storage. */
export default function MultiUpload({ folder, existing }: { folder: string; existing: { file_path: string; file_name: string; kind: string }[] }) {
  const [files, setFiles] = useState<F[]>([]);
  const [kind, setKind] = useState("receipt");
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);

  async function add(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const f of list) {
      if (!TYPES.includes(f.type)) { setMsg({ t: `${f.name}: use a PDF or photo.`, bad: true }); continue; }
      if (f.size > 10 * 1024 * 1024) { setMsg({ t: `${f.name} is over 10 MB.`, bad: true }); continue; }
      setMsg({ t: `Uploading ${f.name}…` });
      const path = `${folder}/${Date.now()}-${f.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80)}`;
      const { error } = await supabaseBrowser().storage.from("run-sheet-files").upload(path, f, { contentType: f.type });
      if (error) { setMsg({ t: `Upload failed: ${error.message}. If you're offline, attach it later.`, bad: true }); continue; }
      setFiles((x) => [...x, { path, name: f.name, kind }]);
      setMsg({ t: `Added ${f.name}. Press Save to keep it with this run sheet.` });
    }
  }

  return (
    <div>
      {existing.length + files.length > 0 && (
        <ul className="mb-3 space-y-1">
          {existing.map((f) => (
            <li key={f.file_path}><a className="link" href={`/portal/files?bucket=run-sheet-files&path=${encodeURIComponent(f.file_path)}`} target="_blank" rel="noopener noreferrer">{f.file_name}</a> <span className="text-sm text-muted">({f.kind.replace("_", " ")})</span></li>
          ))}
          {files.map((f) => <li key={f.path}>{f.name} <span className="text-sm text-muted">({f.kind.replace("_", " ")}, not saved yet)</span></li>)}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field"><label htmlFor="mu-kind">What is it?</label>
          <select id="mu-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="receipt">Receipt</option><option value="fuel">Fuel receipt</option><option value="lodging">Lodging receipt</option>
            <option value="photo">Trip photo</option><option value="delivery_ticket">Signed delivery ticket</option><option value="other">Other</option>
          </select></div>
        <div className="field"><label htmlFor="mu-file">Add files or take a photo</label>
          <input id="mu-file" type="file" multiple accept="application/pdf,image/*" onChange={add} className="input !py-2" aria-describedby="mu-msg" /></div>
      </div>
      <p id="mu-msg" aria-live="polite" className={`mt-1 text-sm ${msg?.bad ? "text-error" : "text-muted"}`}>{msg?.t}</p>
      <input type="hidden" name="files_json" value={JSON.stringify(files)} />
    </div>
  );
}

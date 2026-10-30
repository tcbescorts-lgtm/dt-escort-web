"use client";

import { useEffect, useRef, useState } from "react";

/** Finger/mouse signature captured as a small PNG data URL in a hidden input. */
export default function SignaturePad({ name, label, defaultValue, disabled }: { name: string; label: string; defaultValue?: string | null; disabled?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    if (defaultValue) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
      img.src = defaultValue;
    }
  }, [defaultValue]);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * ref.current!.width, ((e.clientY - r.top) / r.height) * ref.current!.height];
  };

  return (
    <div className="field">
      <p id={`${name}-label`} className="label font-semibold">{label}</p>
      <canvas
        ref={ref}
        width={600}
        height={180}
        role="img"
        aria-labelledby={`${name}-label`}
        aria-describedby={`${name}-help`}
        className="h-36 w-full touch-none rounded-md border-2 border-field bg-white"
        onPointerDown={(e) => {
          if (disabled) return;
          drawing.current = true;
          const ctx = ref.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          if (!drawing.current) return;
          drawing.current = false;
          setValue(ref.current!.toDataURL("image/png"));
        }}
      />
      <p id={`${name}-help`} className="mt-1 text-sm text-muted">{value ? "Signed." : "Sign with your finger or mouse."} Typing your full name in Notes also works if signing isn&apos;t possible.</p>
      <input type="hidden" name={name} value={value} />
      {!disabled && (
        <button type="button" className="btn btn-line mt-2 !min-h-11" onClick={() => {
          const c = ref.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          setValue("");
        }}>Clear signature</button>
      )}
    </div>
  );
}

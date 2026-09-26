"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { uploadImageAction } from "@/app/admin/actions";

/** Output size: 4:3, sharp on retina phones, small enough to load fast. */
const OUT_W = 1200;
const OUT_H = 900;
const MAX_UPLOAD_BYTES = 1_400_000;

interface Crop {
  zoom: number;
  /** Offset of the image centre from the frame centre, in frame pixels. */
  x: number;
  y: number;
}

function coverScale(img: HTMLImageElement, w: number, h: number) {
  return Math.max(w / img.naturalWidth, h / img.naturalHeight);
}

/** Keeps the image covering the whole 4:3 frame (no empty edges). */
function clamp(crop: Crop, img: HTMLImageElement, w: number, h: number): Crop {
  const s = coverScale(img, w, h) * crop.zoom;
  const maxX = Math.max(0, (img.naturalWidth * s - w) / 2);
  const maxY = Math.max(0, (img.naturalHeight * s - h) / 2);
  return { zoom: crop.zoom, x: Math.min(maxX, Math.max(-maxX, crop.x)), y: Math.min(maxY, Math.max(-maxY, crop.y)) };
}

function draw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, crop: Crop, w: number, h: number, frameW: number) {
  const ratio = w / frameW; // frame pixels → canvas pixels
  const s = coverScale(img, w, h) * crop.zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.fillStyle = "#151211";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, (w - dw) / 2 + crop.x * ratio, (h - dh) / 2 + crop.y * ratio, dw, dh);
}

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const attempt = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  // WebP first; some Safari versions silently return PNG, then fall back to JPEG.
  for (const q of [0.82, 0.7, 0.55]) {
    const webp = await attempt("image/webp", q);
    if (webp && webp.type === "image/webp" && webp.size <= MAX_UPLOAD_BYTES) return webp;
    const jpeg = await attempt("image/jpeg", q + 0.05);
    if (jpeg && jpeg.size <= MAX_UPLOAD_BYTES) return jpeg;
  }
  throw new Error("image too large");
}

export function ImageCropper({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const t = useTranslations("admin.item");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; start: Crop } | null>(null);

  useEffect(() => {
    const canvas = previewRef.current;
    const frame = frameRef.current;
    if (!img || !canvas || !frame) return;
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) draw(ctx, img, crop, canvas.width, canvas.height, w);
  }, [img, crop]);

  const load = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setError(false);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setCrop({ zoom: 1, x: 0, y: 0 });
    };
    image.src = url;
  };

  const frameSize = () => ({ w: frameRef.current?.clientWidth ?? 400, h: frameRef.current?.clientHeight ?? 300 });

  const onPointerDown = (e: PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: crop };
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !img) return;
    const { w, h } = frameSize();
    const d = drag.current;
    setCrop(clamp({ zoom: d.start.zoom, x: d.start.x + e.clientX - d.x, y: d.start.y + e.clientY - d.y }, img, w, h));
  };

  const upload = async () => {
    if (!img) return;
    setBusy(true);
    setError(false);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      draw(canvas.getContext("2d")!, img, crop, OUT_W, OUT_H, frameSize().w);
      const blob = await toBlob(canvas);
      const form = new FormData();
      form.append("file", new File([blob], blob.type === "image/webp" ? "photo.webp" : "photo.jpg", { type: blob.type }));
      const res = await uploadImageAction(form);
      if (!res.ok || !res.data) throw new Error("upload failed");
      onChange(res.data);
      setImg(null);
    } catch {
      setError(true);
    }
    setBusy(false);
  };

  if (img) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">{t("cropTitle")}</p>
        <div
          ref={frameRef}
          className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-xl ring-2 ring-flame-500"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
        >
          <canvas ref={previewRef} className="h-full w-full cursor-move" aria-label={t("dragToMove")} />
        </div>
        <p className="text-xs text-cream-500">{t("dragToMove")}</p>
        <label className="flex items-center gap-3 text-sm">
          {t("zoom")}
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={crop.zoom}
            onChange={(e) => {
              const { w, h } = frameSize();
              setCrop(clamp({ ...crop, zoom: Number(e.target.value) }, img, w, h));
            }}
            className="flex-1 accent-flame-500"
          />
        </label>
        {error && <p className="text-sm text-ember-500">{t("uploadFailed")}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={upload} disabled={busy} className="h-11 rounded-full bg-flame-500 px-5 font-bold text-coal-950 disabled:opacity-50">
            {busy ? t("uploading") : t("usePhoto")}
          </button>
          <button type="button" onClick={() => setImg(null)} className="h-11 rounded-full bg-coal-700 px-4 text-sm">
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          load(e.dataTransfer.files[0]);
        }}
        className={`relative grid aspect-[4/3] w-full cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed ${
          dragOver ? "border-flame-500 bg-flame-500/10" : "border-coal-600 bg-coal-800"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of the uploaded photo
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="px-6 text-center text-sm text-cream-300">📷 {t("photoHint")}</span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => load(e.target.files?.[0])} />
        <span className="absolute bottom-2 right-2 rounded-full bg-coal-950/80 px-3 py-1.5 text-xs font-bold">{t("choosePhoto")}</span>
      </label>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="text-sm font-semibold text-ember-500">
          {t("removePhoto")}
        </button>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/forms/form-controls";
import {
  clampOffset,
  coverScale,
  drawComposite,
  exportComposite,
  loadPhoto,
} from "@/lib/photobooth/compose";
import { cn } from "@/lib/utils/cn";
import type { PhotoBoothSlot, PhotoBoothTemplate, PhotoPlacement } from "@/lib/types";

type Props = {
  templates: Array<PhotoBoothTemplate & { slotCount: number }>;
};

type Status = { state: "idle" | "working" | "done" | "error"; message?: string };

export function PhotoBoothStudio({ templates }: Props) {
  const [templateSlug, setTemplateSlug] = useState(templates[0]?.slug ?? "");
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [slots, setSlots] = useState<PhotoBoothSlot[]>([]);
  const [photos, setPhotos] = useState<Record<string, PhotoPlacement>>({});
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [frameReady, setFrameReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frameImageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    slotId: string;
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());

  const template = useMemo(
    () => templates.find((item) => item.slug === templateSlug),
    [templates, templateSlug],
  );

  const filledCount = Object.keys(photos).length;

  /** True while the newly selected template is still being fetched. */
  const loadingTemplate = loadedSlug !== templateSlug;

  /* ---------------------------------------------------------------------- */
  /* Template + frame loading                                               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setFrameReady(false);

      try {
        const response = await fetch(`/api/photo-booth/templates/${templateSlug}`);
        if (!response.ok) {
          if (!cancelled) {
            setStatus({ state: "error", message: "This template could not be loaded." });
          }
          return;
        }

        const data = (await response.json()) as {
          template: PhotoBoothTemplate;
          slots: PhotoBoothSlot[];
        };

        if (cancelled) return;

        // Revoke photos belonging to the template we are leaving.
        setPhotos((current) => {
          for (const placement of Object.values(current)) URL.revokeObjectURL(placement.url);
          return {};
        });

        const frame = new window.Image();
        frame.crossOrigin = "anonymous";

        frame.onload = () => {
          if (cancelled) return;
          frameImageRef.current = frame;
          setFrameReady(true);
        };
        frame.onerror = () => {
          if (cancelled) return;
          frameImageRef.current = null;
          setFrameReady(true);
        };
        frame.src = data.template.frame_image;

        setSlots(data.slots);
        setPhotos({});
        setActiveSlotId(data.slots[0]?.id ?? null);
        setStatus({ state: "idle" });
        setLoadedSlug(templateSlug);
      } catch {
        if (!cancelled) {
          setStatus({ state: "error", message: "This template could not be loaded." });
          setLoadedSlug(templateSlug);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [templateSlug]);

  useEffect(
    () => () => {
      for (const placement of Object.values(photos)) URL.revokeObjectURL(placement.url);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ---------------------------------------------------------------------- */
  /* Rendering                                                              */
  /* ---------------------------------------------------------------------- */

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    drawComposite(context, {
      template,
      slots,
      photos,
      frameImage: frameImageRef.current,
      activeSlotId,
      showEmptyHints: true,
    });
  }, [template, slots, photos, activeSlotId]);

  useEffect(() => {
    redraw();
  }, [redraw, frameReady]);

  useEffect(() => {
    const handleResize = () => redraw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [redraw]);

  /* ---------------------------------------------------------------------- */
  /* Pointer interactions                                                   */
  /* ---------------------------------------------------------------------- */

  const toTemplateCoords = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * template.width,
      y: ((event.clientY - rect.top) / rect.height) * template.height,
    };
  };

  const slotAt = (x: number, y: number) => {
    // Later slots sit on top, so check in reverse order.
    for (let index = slots.length - 1; index >= 0; index -= 1) {
      const slot = slots[index];
      const withinX = x >= slot.x && x <= slot.x + slot.width;
      const withinY = y >= slot.y && y <= slot.y + slot.height;
      if (withinX && withinY) return slot;
    }
    return null;
  };

  const updatePlacement = (slotId: string, update: Partial<PhotoPlacement>) => {
    setPhotos((current) => {
      const placement = current[slotId];
      if (!placement) return current;
      return { ...current, [slotId]: { ...placement, ...update } };
    });
  };

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!template) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    const { x, y } = toTemplateCoords(event);
    pointersRef.current.set(event.pointerId, { x, y });

    const slot = slotAt(x, y);
    if (!slot) {
      setActiveSlotId(null);
      return;
    }

    setActiveSlotId(slot.id);

    const placement = photos[slot.id];
    if (!placement) return;

    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: placement.scale,
      };
      return;
    }

    dragRef.current = {
      slotId: slot.id,
      pointerId: event.pointerId,
      startX: x,
      startY: y,
      originX: placement.offsetX,
      originY: placement.offsetY,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!template) return;

    const tracked = pointersRef.current.get(event.pointerId);
    if (tracked) pointersRef.current.set(event.pointerId, tracked);

    const { x, y } = toTemplateCoords(event);

    if (pointersRef.current.size === 2 && pinchRef.current && activeSlotId) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance <= 0) return;
      const slot = slots.find((item) => item.id === activeSlotId);
      const placement = photos[activeSlotId];
      if (!slot || !placement) return;

      const nextScale = Math.min(
        3,
        Math.max(1, pinchRef.current.scale * (distance / pinchRef.current.distance)),
      );
      updatePlacement(activeSlotId, {
        scale: nextScale,
        offsetX: clampOffset(placement.offsetX, placement, slot, "x"),
        offsetY: clampOffset(placement.offsetY, placement, slot, "y"),
      });
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const slot = slots.find((item) => item.id === drag.slotId);
    const placement = photos[drag.slotId];
    if (!slot || !placement) return;

    const nextX = drag.originX + (x - drag.startX);
    const nextY = drag.originY + (y - drag.startY);

    updatePlacement(drag.slotId, {
      offsetX: clampOffset(nextX, placement, slot, "x"),
      offsetY: clampOffset(nextY, placement, slot, "y"),
    });
  }

  function endPointer(event: React.PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  function handleWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    const slotId = activeSlotId;
    if (!slotId) return;

    const slot = slots.find((item) => item.id === slotId);
    const placement = photos[slotId];
    if (!slot || !placement) return;

    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.06 : 1 / 1.06;
    const nextScale = Math.min(3, Math.max(1, placement.scale * factor));

    updatePlacement(slotId, {
      scale: nextScale,
      offsetX: clampOffset(placement.offsetX, placement, slot, "x"),
      offsetY: clampOffset(placement.offsetY, placement, slot, "y"),
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const slotId = activeSlotId;
    if (!slotId) return;

    const slot = slots.find((item) => item.id === slotId);
    const placement = photos[slotId];
    if (!slot || !placement) return;

    const step = event.shiftKey ? 20 : 6;
    let handled = true;

    if (event.key === "ArrowLeft") {
      updatePlacement(slotId, { offsetX: clampOffset(placement.offsetX - step, placement, slot, "x") });
    } else if (event.key === "ArrowRight") {
      updatePlacement(slotId, { offsetX: clampOffset(placement.offsetX + step, placement, slot, "x") });
    } else if (event.key === "ArrowUp") {
      updatePlacement(slotId, { offsetY: clampOffset(placement.offsetY - step, placement, slot, "y") });
    } else if (event.key === "ArrowDown") {
      updatePlacement(slotId, { offsetY: clampOffset(placement.offsetY + step, placement, slot, "y") });
    } else if (event.key === "+" || event.key === "=") {
      updatePlacement(slotId, {
        scale: Math.min(3, placement.scale * 1.08),
        offsetX: clampOffset(placement.offsetX, placement, slot, "x"),
        offsetY: clampOffset(placement.offsetY, placement, slot, "y"),
      });
    } else if (event.key === "-") {
      updatePlacement(slotId, {
        scale: Math.max(1, placement.scale / 1.08),
        offsetX: clampOffset(placement.offsetX, placement, slot, "x"),
        offsetY: clampOffset(placement.offsetY, placement, slot, "y"),
      });
    } else if (event.key.toLowerCase() === "r") {
      updatePlacement(slotId, { rotation: (placement.rotation + 90) % 360 });
    } else {
      handled = false;
    }

    if (handled) event.preventDefault();
  }

  /* ---------------------------------------------------------------------- */
  /* Photo handling                                                          */
  /* ---------------------------------------------------------------------- */

  async function handlePhotoSelected(slotId: string, file: File) {
    setStatus({ state: "working", message: "Preparing your photo…" });

    try {
      const placement = await loadPhoto(file);
      setPhotos((current) => {
        const previous = current[slotId];
        if (previous) URL.revokeObjectURL(previous.url);
        return { ...current, [slotId]: placement };
      });
      setActiveSlotId(slotId);
      setStatus({ state: "idle" });
    } catch {
      setStatus({ state: "error", message: "That file could not be opened. Try a JPG or PNG." });
    }
  }

  function removePhoto(slotId: string) {
    setPhotos((current) => {
      const placement = current[slotId];
      if (placement) URL.revokeObjectURL(placement.url);
      const next = { ...current };
      delete next[slotId];
      return next;
    });
  }

  function resetSlot(slotId: string) {
    updatePlacement(slotId, { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });
  }

  async function download() {
    if (!template || slots.length === 0) return;

    setStatus({ state: "working", message: "Creating your photo…" });

    const frame = await new Promise<CanvasImageSource | null>((resolve) => {
      if (frameImageRef.current) {
        resolve(frameImageRef.current);
        return;
      }
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = template.frame_image;
    });

    const result = await exportComposite(
      { template, slots, photos, frameImage: frame },
      `tsss-photo-booth-${template.slug}`,
    );

    setStatus(
      result.ok
        ? { state: "done", message: "Your photo is ready — check your downloads." }
        : { state: "error", message: result.message ?? "The photo could not be created." },
    );
  }

  if (templates.length === 0) {
    return (
      <div className="surface-card p-10 text-center">
        <h2 className="font-display text-xl font-semibold text-ink-900">No templates available yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          An administrator has not published any Photo Booth templates. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Template picker */}
      <div className="lg:col-span-4 xl:col-span-3">
        <h2 className="font-display text-lg font-semibold text-ink-900">Choose a template</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
          {templates.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setTemplateSlug(item.slug)}
              aria-pressed={item.slug === templateSlug}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                item.slug === templateSlug
                  ? "border-gold-400 bg-gold-50 shadow-sm"
                  : "border-brand-200 bg-white hover:border-gold-300",
              )}
            >
              <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-ink-900">
                <Image
                  src={item.preview_image ?? item.frame_image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink-900">{item.name}</span>
                <span className="block text-xs text-slate-500">
                  {item.slotCount} photo{item.slotCount === 1 ? "" : "s"}
                </span>
              </span>
              {item.is_featured ? (
                <span className="ml-auto hidden shrink-0 sm:block">
                  <Badge tone="gold">Popular</Badge>
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
          Your photos stay on your device. Nothing is uploaded, stored or shared — the picture is created in your
          browser and downloaded straight to you.
        </p>
      </div>

      {/* Canvas */}
      <div className="lg:col-span-8 xl:col-span-6">
        <div className="surface-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {template?.name ?? "Photo Booth"}
              </h2>
              <p className="text-xs text-slate-500">
                {filledCount} of {slots.length} photo{slots.length === 1 ? "" : "s"} added
              </p>
            </div>
            <button
              type="button"
              onClick={download}
              disabled={status.state === "working" || slots.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-6 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {status.state === "working" ? <Spinner /> : null}
              {status.state === "working" ? "Creating…" : "Download photo"}
            </button>
          </div>

          {status.message ? (
            <p
              role="status"
              className={cn(
                "mt-3 rounded-xl px-4 py-2.5 text-xs",
                status.state === "error"
                  ? "bg-red-50 text-red-700"
                  : status.state === "done"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-slate-50 text-slate-600",
              )}
            >
              {status.message}
            </p>
          ) : null}

          <div
            ref={wrapperRef}
            className="relative mx-auto mt-5 w-full max-w-[520px] overflow-hidden rounded-3xl bg-ink-950 shadow-inner"
          >
            {template ? (
              <canvas
                ref={canvasRef}
                width={template.width}
                height={template.height}
                tabIndex={0}
                role="application"
                aria-label={`Photo Booth canvas for ${template.name}. Use the arrow keys to move the selected photo.`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
                onWheel={handleWheel}
                onKeyDown={handleKeyDown}
                className="block h-auto w-full touch-none select-none"
              />
            ) : null}

            {loadingTemplate ? (
              <div className="absolute inset-0 grid place-items-center bg-ink-950/70 text-white">
                <span className="flex items-center gap-2 text-sm">
                  <Spinner /> Loading template…
                </span>
              </div>
            ) : null}
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            Drag a photo to reposition it · scroll or pinch to zoom · arrow keys when using a keyboard
          </p>
        </div>
      </div>

      {/* Slot controls */}
      <div className="lg:col-span-12 xl:col-span-3">
        <h2 className="font-display text-lg font-semibold text-ink-900">Photos &amp; adjustments</h2>

        <div className="mt-4 space-y-3">
          {slots.map((slot, index) => {
            const placement = photos[slot.id];
            const isActive = slot.id === activeSlotId;

            return (
              <div
                key={slot.id}
                className={cn(
                  "rounded-2xl border p-4 transition-colors",
                  isActive ? "border-gold-400 bg-gold-50/60" : "border-brand-200 bg-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSlotId(slot.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-pressed={isActive}
                  >
                    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-900 text-xs font-bold text-white">
                      {placement ? (
                        <Image src={placement.url} alt="" fill sizes="48px" className="object-cover" unoptimized />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {slot.label ?? `Photo ${index + 1}`}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {placement ? "Photo added" : "No photo yet"}
                      </span>
                    </span>
                  </button>

                  <label className="inline-flex shrink-0 cursor-pointer items-center rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700">
                    {placement ? "Replace" : "Add photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handlePhotoSelected(slot.id, file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {placement && isActive ? (
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="flex items-center justify-between text-xs font-medium text-slate-600">
                        Zoom
                        <span className="font-mono">{Math.round(placement.scale * 100)}%</span>
                      </span>
                      <input
                        type="range"
                        min={100}
                        max={300}
                        step={2}
                        value={Math.round(placement.scale * 100)}
                        onChange={(event) => {
                          const nextScale = Number(event.target.value) / 100;
                          updatePlacement(slot.id, {
                            scale: nextScale,
                            offsetX: clampOffset(placement.offsetX, placement, slot, "x"),
                            offsetY: clampOffset(placement.offsetY, placement, slot, "y"),
                          });
                        }}
                        className="mt-1.5 w-full accent-gold-500"
                      />
                    </label>

                    <label className="block">
                      <span className="flex items-center justify-between text-xs font-medium text-slate-600">
                        Rotation
                        <span className="font-mono">{Math.round(placement.rotation)}°</span>
                      </span>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={Math.round(placement.rotation)}
                        onChange={(event) =>
                          updatePlacement(slot.id, { rotation: Number(event.target.value) })
                        }
                        className="mt-1.5 w-full accent-gold-500"
                      />
                    </label>

                    <p className="text-[0.68rem] leading-relaxed text-slate-500">
                      Photo size {Math.round(placement.image.width)}×{Math.round(placement.image.height)}px ·
                      fits at {Math.round(coverScale(placement.image.width, placement.image.height, slot) * 100)}%
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => resetSlot(slot.id)}
                        className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updatePlacement(slot.id, { rotation: (placement.rotation + 90) % 360 })
                        }
                        className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700"
                      >
                        Rotate 90°
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(slot.id)}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
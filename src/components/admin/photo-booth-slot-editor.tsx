"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { FieldError, FormMessage } from "@/components/forms/form-controls";
import { savePhotoBoothSlotsAction } from "@/lib/actions/admin-actions";
import { INITIAL_ADMIN_STATE } from "@/lib/actions/state";
import { cn } from "@/lib/utils/cn";
import type { PhotoBoothSlot, PhotoBoothTemplate } from "@/lib/types";

type Draft = {
  label: string;
  shape: "rect" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  rotation: number;
};

const MIN_SIZE = 40;

function toDraft(slot: PhotoBoothSlot, index: number): Draft {
  return {
    label: slot.label ?? `Photo ${index + 1}`,
    shape: slot.shape,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    radius: slot.radius,
    rotation: Number(slot.rotation),
  };
}

/**
 * Visual editor for the photo windows inside a frame: drag to move, use the
 * corner handle to resize, and the numeric fields for exact values.
 */
export function PhotoBoothSlotEditor({
  template,
  slots,
}: {
  template: PhotoBoothTemplate;
  slots: PhotoBoothSlot[];
}) {
  const [state, formAction] = useActionState(savePhotoBoothSlotsAction, INITIAL_ADMIN_STATE);
  // The component is keyed by template id in the admin page, so these
  // initialisers run again whenever a different template is opened.
  const [drafts, setDrafts] = useState<Draft[]>(() => slots.map(toDraft));
  const [selected, setSelected] = useState<number | null>(slots[0] ? 0 : null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ index: number; startX: number; startY: number } | null>(null);

  const errors = (state.errors ?? {}) as Record<string, string>;

  /* ---------------------------------------------------------------------- */
  /* Canvas preview                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const scale = canvas.width / template.width;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const frame = new window.Image();
    frame.crossOrigin = "anonymous";

    const paint = () => {
      setFrameLoaded(true);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(frame, 0, 0, canvas.width, canvas.height);

      drafts.forEach((draft, index) => {
        const isSelected = index === selected;

        context.save();
        context.fillStyle = isSelected ? "rgba(255,176,32,0.22)" : "rgba(59,130,246,0.18)";
        context.strokeStyle = isSelected ? "#ffb020" : "#60a5fa";
        context.lineWidth = isSelected ? 3 : 2;
        context.setLineDash(isSelected ? [] : [8, 6]);

        if (draft.shape === "circle") {
          context.beginPath();
          context.ellipse(
            (draft.x + draft.width / 2) * scale,
            (draft.y + draft.height / 2) * scale,
            (draft.width / 2) * scale,
            (draft.height / 2) * scale,
            0,
            0,
            Math.PI * 2,
          );
        } else {
          context.beginPath();
          context.rect(draft.x * scale, draft.y * scale, draft.width * scale, draft.height * scale);
        }

        context.fill();
        context.stroke();
        context.restore();

        context.save();
        context.fillStyle = isSelected ? "#ffb020" : "#ffffff";
        context.font = "600 12px system-ui, sans-serif";
        context.textBaseline = "top";
        context.fillText(draft.label, draft.x * scale + 4, draft.y * scale + 4);
        context.restore();
      });
    };

    frame.onload = paint;
    frame.onerror = () => setFrameLoaded(false);
    frame.src = template.frame_image;
  }, [drafts, selected, template]);

  /* ---------------------------------------------------------------------- */
  /* Pointer interactions                                                   */
  /* ---------------------------------------------------------------------- */

  function hitTest(x: number, y: number) {
    for (let index = drafts.length - 1; index >= 0; index -= 1) {
      const draft = drafts[index];
      if (x >= draft.x && x <= draft.x + draft.width && y >= draft.y && y <= draft.y + draft.height) {
        return index;
      }
    }
    return null;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * template.width;
    const y = ((event.clientY - rect.top) / rect.height) * template.height;

    const index = hitTest(x, y);
    setSelected(index);

    if (index === null) {
      // Click on empty canvas: create a window there.
      const width = Math.round(template.width * 0.3);
      const height = Math.round(template.height * 0.22);
      const created: Draft = {
        label: `Photo ${drafts.length + 1}`,
        shape: "rect",
        x: Math.round(Math.max(0, Math.min(x - width / 2, template.width - width))),
        y: Math.round(Math.max(0, Math.min(y - height / 2, template.height - height))),
        width,
        height,
        radius: 24,
        rotation: 0,
      };
      setDrafts((current) => [...current, created]);
      dragRef.current = { index: drafts.length, startX: x, startY: y };
      return;
    }

    dragRef.current = { index, startX: x, startY: y };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * template.width;
    const y = ((event.clientY - rect.top) / rect.height) * template.height;

    const dx = x - drag.startX;
    const dy = y - drag.startY;

    setDrafts((current) =>
      current.map((draft, index) => {
        if (index !== drag.index) return draft;

        // Shift resizes, plain drag moves.
        const resize = event.shiftKey;
        const width = resize ? Math.max(MIN_SIZE, Math.min(template.width - draft.x, draft.width + dx)) : draft.width;
        const height = resize
          ? Math.max(MIN_SIZE, Math.min(template.height - draft.y, draft.height + dy))
          : draft.height;

        return {
          ...draft,
          x: resize ? draft.x : Math.round(Math.max(0, Math.min(draft.x + dx, template.width - draft.width))),
          y: resize ? draft.y : Math.round(Math.max(0, Math.min(draft.y + dy, template.height - draft.height))),
          width: Math.round(width),
          height: Math.round(height),
        };
      }),
    );
  }

  function endDrag() {
    dragRef.current = null;
  }

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* ---------------------------------------------------------------------- */

  function updateField(index: number, field: keyof Draft, value: string | number) {
    setDrafts((current) =>
      current.map((draft, draftIndex) => {
        if (draftIndex !== index) return draft;
        const next = { ...draft, [field]: value } as Draft;

        if (field === "shape" && value === "circle") {
          next.radius = Math.round(Math.min(next.width, next.height) / 2);
        }
        if (field === "shape" && value === "rect" && next.radius > Math.min(next.width, next.height) / 2) {
          next.radius = 24;
        }
        if (field === "width" || field === "height") {
          const size = Number(value);
          if (!Number.isNaN(size)) {
            next.width = Math.max(MIN_SIZE, Math.round(Math.min(size, template.width)));
            next.height = Math.max(MIN_SIZE, Math.round(Math.min(size, template.height)));
          }
        }
        return next;
      }),
    );
  }

  function addWindow() {
    const width = Math.round(template.width * 0.3);
    const height = Math.round(template.height * 0.2);
    const offset = drafts.length * 24;

    setDrafts((current) => [
      ...current,
      {
        label: `Photo ${current.length + 1}`,
        shape: "rect",
        x: Math.min(Math.round(template.width * 0.1) + offset, template.width - width),
        y: Math.min(Math.round(template.height * 0.35) + offset, template.height - height),
        width,
        height,
        radius: 24,
        rotation: 0,
      },
    ]);
    setSelected(drafts.length);
  }

  function removeWindow(index: number) {
    setDrafts((current) => current.filter((_, draftIndex) => draftIndex !== index));
    setSelected(null);
  }

  const active = selected !== null ? drafts[selected] : null;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="template_id" value={template.id} />
      <input type="hidden" name="slots" value={JSON.stringify(drafts)} />

      <FormMessage state={state as never} />
      <FieldError message={errors.slots} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-ink-950">
            <canvas
              ref={canvasRef}
              width={template.width}
              height={template.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="block h-auto w-full touch-none select-none"
            />
            {!frameLoaded ? (
              <div className="absolute inset-0 grid place-items-center bg-ink-950 text-xs text-white/60">
                Loading frame…
              </div>
            ) : null}
          </div>

          <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
            <li>• Drag a window to move it. Hold <kbd className="rounded bg-slate-100 px-1">Shift</kbd> while dragging to resize.</li>
            <li>• Click empty canvas to add a window.</li>
            <li>• Keep windows inside the frame — transparent areas in the PNG are the photo windows.</li>
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addWindow}
              className="rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700"
            >
              Add window
            </button>
            <span className="text-xs text-slate-500">
              {drafts.length} window{drafts.length === 1 ? "" : "s"}
            </span>
          </div>

          {drafts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brand-200 p-6 text-center text-sm text-slate-500">
              This template has no photo windows yet. Visitors will see an empty frame.
            </p>
          ) : (
            <ul className="space-y-2">
              {drafts.map((draft, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => setSelected(index)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      index === selected
                        ? "border-gold-400 bg-gold-50"
                        : "border-brand-200 bg-white hover:border-gold-300",
                    )}
                  >
                    <span className="text-ink-900">{draft.label}</span>
                    <span className="font-mono text-xs text-slate-500">
                      {draft.width}×{draft.height} · {draft.shape}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {active ? (
            <div className="rounded-2xl border border-brand-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{active.label}</p>
                <button
                  type="button"
                  onClick={() => removeWindow(selected as number)}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-600">
                  Label
                  <input
                    type="text"
                    value={active.label}
                    onChange={(event) => updateField(selected as number, "label", event.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-brand-200 px-3 text-sm focus:border-gold-400 focus:outline-none"
                  />
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Shape
                  <select
                    value={active.shape}
                    onChange={(event) =>
                      updateField(selected as number, "shape", event.target.value)
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-brand-200 px-3 text-sm focus:border-gold-400 focus:outline-none"
                  >
                    <option value="rect">Rectangle</option>
                    <option value="circle">Circle</option>
                  </select>
                </label>

                {(
                  [
                    ["x", "X"],
                    ["y", "Y"],
                    ["width", "Width"],
                    ["height", "Height"],
                    ["radius", "Corner radius"],
                    ["rotation", "Rotation (°)"],
                  ] as Array<[keyof Draft, string]>
                ).map(([field, label]) => (
                  <label key={field} className="text-xs font-medium text-slate-600">
                    {label}
                    <input
                      type="number"
                      value={String(active[field])}
                      step={field === "rotation" ? 1 : 2}
                      onChange={(event) => updateField(selected as number, field, Number(event.target.value))}
                      className="mt-1 h-9 w-full rounded-lg border border-brand-200 px-3 text-sm focus:border-gold-400 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <SaveSlotButton />
    </form>
  );
}

function SaveSlotButton() {
  return (
    <button
      type="submit"
      className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
    >
      Save photo windows
    </button>
  );
}
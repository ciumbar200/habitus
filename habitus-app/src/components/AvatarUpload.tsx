import { useRef, useState } from "react";
import { es, imageUrlOrPlaceholder, normalizeImageUrl, uploadImage } from "@habitus/core";
import { Icon } from "./Icon";

type AvatarUploadProps = {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  displayName?: string;
};

export function AvatarUpload({ userId, value, onChange, displayName }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const preview = imageUrlOrPlaceholder(value);
  const initial = (displayName?.trim()[0] ?? "?").toUpperCase();

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const { url, error: upErr } = await uploadImage("habitus-avatars", userId, file);
    setUploading(false);
    if (upErr || !url) {
      setError(upErr ?? es.upload.error);
      return;
    }
    onChange(url);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    void handleFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative shrink-0">
        <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-surface-container-high bg-surface-container shadow-md">
          {value ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-teal-accent/10 text-headline-lg text-teal-accent">
              {initial}
            </div>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-deep-navy/50">
            <Icon name="progress_activity" className="animate-spin text-[28px] text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <p className="text-label-sm text-warm-slate">{es.upload.avatarHint}</p>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragOver
              ? "border-teal-accent bg-teal-accent/5"
              : "border-border-light bg-surface-container hover:border-teal-accent/50"
          }`}
        >
          <Icon name="cloud_upload" className="mx-auto mb-2 text-[32px] text-teal-accent" />
          <p className="text-label-md text-deep-navy">
            {uploading ? es.upload.uploading : "Arrastra una foto o haz clic para subir"}
          </p>
          <p className="mt-1 text-label-sm text-warm-slate">{es.upload.dropHint}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onInputChange}
          />
        </div>

        <div>
          <label className="mb-1 block text-label-sm text-warm-slate">{es.upload.orPasteUrl}</label>
          <input
            type="url"
            value={value ?? ""}
            onChange={(e) => onChange(normalizeImageUrl(e.target.value))}
            placeholder="https://…"
            className="w-full rounded-lg border border-border-light px-3 py-2 text-body-md"
          />
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-label-sm text-warm-slate underline hover:text-deep-navy"
          >
            {es.upload.remove}
          </button>
        )}

        {error && (
          <p className="rounded-lg bg-error-container px-3 py-2 text-label-sm text-on-error-container">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

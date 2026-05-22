import { useRef, useState } from "react";
import { es, imageUrlOrPlaceholder, uploadImage } from "@habitus/core";
import { Icon } from "./Icon";

type ListingGalleryUploadProps = {
  userId: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
};

export function ListingGalleryUpload({
  userId,
  urls,
  onChange,
  max = 8,
}: ListingGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = max - urls.length;
    if (remaining <= 0) {
      setError(`Máximo ${max} fotos.`);
      return;
    }

    setUploading(true);
    setError(null);
    const next = [...urls];

    for (const file of Array.from(fileList).slice(0, remaining)) {
      const { url, error: upErr } = await uploadImage("habitus-listings", userId, file);
      if (upErr || !url) {
        setError(upErr ?? es.upload.error);
        break;
      }
      next.push(url);
    }

    onChange(next);
    setUploading(false);
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-label-sm text-warm-slate">{es.panel.form.galleryHint}</p>

      {urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url, i) => (
            <div key={`${url}-${i}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border-light">
              <img src={imageUrlOrPlaceholder(url)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-deep-navy/80 text-white"
                aria-label={es.upload.remove}
              >
                <Icon name="close" className="text-[16px]" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-2 left-2 rounded bg-teal-accent px-2 py-0.5 text-[10px] font-bold text-deep-navy">
                  {es.panel.form.coverBadge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {urls.length < max && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-light px-4 py-5 text-label-md text-deep-navy hover:border-teal-accent/50 disabled:opacity-60"
        >
          <Icon name="add_photo_alternate" className="text-teal-accent" />
          {uploading ? es.upload.uploading : es.panel.form.addPhotos}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="rounded-lg bg-error-container px-3 py-2 text-label-sm text-on-error-container">
          {error}
        </p>
      )}
    </div>
  );
}

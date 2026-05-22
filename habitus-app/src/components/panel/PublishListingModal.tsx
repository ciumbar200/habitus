import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { es } from "@habitus/core";
import { listingCopyForRole } from "@habitus/core";
import { Icon } from "../Icon";
import { ListingEditorForm, type ListingSaveResult } from "./ListingEditorForm";
import { useAuth } from "../../context/AuthContext";

type PublishListingModalProps = {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
  listingId?: string;
};

export function PublishListingModal({
  open,
  onClose,
  onPublished,
  listingId,
}: PublishListingModalProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const copy = listingCopyForRole(profile?.accountRole);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSuccess = (result: ListingSaveResult) => {
    onPublished?.();
    onClose();
    if (result.status === "published" && result.visibility === "private") {
      navigate(`/panel/espacios/${result.id}/acceso`, { replace: true });
      return;
    }
    if (result.status === "draft" && !listingId) {
      navigate(`/panel/espacios/${result.id}/editar`, { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-deep-navy/50"
        aria-label={es.common.close}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-listing-title"
        className="relative flex max-h-[min(92vh,900px)] w-full max-w-[42rem] flex-col overflow-hidden rounded-t-xl border border-border-light bg-surface shadow-2xl sm:rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-light px-5 py-4">
          <h2 id="publish-listing-title" className="text-headline-md text-deep-navy">
            {listingId ? copy.editListing : copy.publishModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-warm-slate hover:bg-surface-container"
            aria-label={es.common.close}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ListingEditorForm
            key={listingId ?? "new"}
            listingId={listingId}
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}

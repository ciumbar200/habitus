import { Link, useNavigate, useParams } from "react-router-dom";
import { es } from "@habitus/core";
import { listingCopyForRole } from "@habitus/core";
import { ListingEditorForm } from "../../components/panel/ListingEditorForm";
import { useAuth } from "../../context/AuthContext";

export function ListingEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEdit = Boolean(id);
  const copy = listingCopyForRole(profile?.accountRole);

  return (
    <main className="mx-auto max-w-3xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <Link to="/panel/espacios" className="mb-4 inline-block text-label-sm text-teal-accent hover:underline">
        ← {es.common.back}
      </Link>
      <h1 className="mb-8 text-headline-lg text-deep-navy">
        {isEdit ? copy.editListing : copy.newListing}
      </h1>
      <ListingEditorForm
        listingId={id}
        onCancel={() => navigate("/panel/espacios")}
        onDeleted={() => navigate("/panel/espacios", { replace: true })}
        onSuccess={(result) => {
          if (result.status === "draft") {
            navigate(isEdit ? "/panel/espacios" : `/panel/espacios/${result.id}/editar`, {
              replace: true,
            });
            return;
          }
          if (result.visibility === "private") {
            navigate(`/panel/espacios/${result.id}/acceso`, { replace: true });
          } else {
            navigate("/panel/espacios", { replace: true });
          }
        }}
      />
    </main>
  );
}

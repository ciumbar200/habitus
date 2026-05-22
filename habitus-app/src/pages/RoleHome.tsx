import { Navigate } from "react-router-dom";
import { homePathForRole } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/PageState";

export function RoleHome() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24">
        <LoadingState />
      </main>
    );
  }

  return <Navigate to={homePathForRole(profile?.accountRole)} replace />;
}

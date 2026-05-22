import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePathForRole } from "@habitus/core";

type AdminGateProps = {
  children: React.ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const { profile, profileReady } = useAuth();

  if (!profileReady) return null;

  if (!profile?.isAdmin) {
    return <Navigate to={homePathForRole(profile?.accountRole)} replace />;
  }

  return <>{children}</>;
}

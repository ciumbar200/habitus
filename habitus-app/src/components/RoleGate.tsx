import { Navigate, useLocation } from "react-router-dom";
import { canAccessPath, homePathForRole } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import type { AccountRoleSlug } from "@habitus/core";

type RoleGateProps = {
  children: React.ReactNode;
  allow?: AccountRoleSlug[];
};

export function RoleGate({ children, allow }: RoleGateProps) {
  const { profile } = useAuth();
  const { pathname: path } = useLocation();
  const role = profile?.accountRole;

  if (allow && role && !allow.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }
  if (role && !canAccessPath(role, path, { isAdmin: profile?.isAdmin })) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <>{children}</>;
}

import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { FunnelLayout } from "./components/FunnelLayout";
import { PublicLayout } from "./components/PublicLayout";
import { RequireAuth } from "./components/RequireAuth";
import { RoleGate } from "./components/RoleGate";
import { DiscoverPage } from "./pages/DiscoverPage";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { MatchesPage } from "./pages/MatchesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MessagesPage } from "./pages/MessagesPage";
import { AccessPage } from "./pages/AccessPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { CompleteAccountRolePage } from "./pages/CompleteAccountRolePage";
import { PanelDashboardPage } from "./pages/panel/PanelDashboardPage";
import { ListingsRouterPage } from "./pages/panel/ListingsRouterPage";
import { ListingEditorPage } from "./pages/panel/ListingEditorPage";
import { ReviewApplicationsPage } from "./pages/panel/ReviewApplicationsPage";
import { LandingPage } from "./pages/public/LandingPage";
import { PublicListingsPage } from "./pages/public/PublicListingsPage";
import { ListingsLegacyRedirect } from "./pages/public/ListingsLegacyRedirect";
import { HostLandingPage } from "./pages/public/HostLandingPage";
import { OwnerLandingPage } from "./pages/public/OwnerLandingPage";
import { AgencyLandingPage } from "./pages/public/AgencyLandingPage";
import { HowItWorksPage } from "./pages/public/HowItWorksPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { CommunityPage } from "./pages/CommunityPage";
import { CompatibilityQuizPage } from "./pages/CompatibilityQuizPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { PanelConvivenciaPage } from "./pages/panel/PanelConvivenciaPage";
import { AdminLayout } from "./components/AdminLayout";
import { AdminGate } from "./components/AdminGate";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminListingsPage } from "./pages/admin/AdminListingsPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { MemberPublicPage } from "./pages/MemberPublicPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { CreateGroupPage } from "./pages/CreateGroupPage";
import { GroupsPage } from "./pages/GroupsPage";
import { ListingAccessPage } from "./pages/panel/ListingAccessPage";

function AuthShell() {
  return (
    <RequireAuth>
      <RoleGate>
        <Outlet />
      </RoleGate>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="alojamientos" element={<PublicListingsPage />} />
          <Route path="listings" element={<ListingsLegacyRedirect />} />
          <Route path="anfitriones" element={<HostLandingPage />} />
          <Route path="propietarios" element={<OwnerLandingPage />} />
          <Route path="agencias" element={<AgencyLandingPage />} />
          <Route path="como-funciona" element={<HowItWorksPage />} />
        </Route>

        <Route element={<FunnelLayout />}>
          <Route path="/access" element={<AccessPage />} />
          <Route path="/olvide-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/completar-rol" element={<CompleteAccountRolePage />} />
          <Route path="/cuestionario-compatibilidad" element={<CompatibilityQuizPage />} />
        </Route>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route element={<AppLayout />}>
          <Route path="property/:id" element={<PropertyDetailPage />} />
          <Route
            path="miembro/:slug"
            element={
              <RequireAuth>
                <MemberPublicPage />
              </RequireAuth>
            }
          />
          <Route element={<AuthShell />}>
            <Route
              path="descubrir"
              element={
                <RoleGate allow={["inquilino"]}>
                  <DiscoverPage />
                </RoleGate>
              }
            />
            <Route
              path="matches"
              element={
                <RoleGate allow={["inquilino"]}>
                  <MatchesPage />
                </RoleGate>
              }
            />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/editar" element={<ProfileEditPage />} />
            <Route path="comunidad" element={<CommunityPage />} />
            <Route
              path="grupos"
              element={
                <RoleGate allow={["inquilino"]}>
                  <GroupsPage />
                </RoleGate>
              }
            />
            <Route
              path="grupos/nuevo"
              element={
                <RoleGate allow={["inquilino"]}>
                  <CreateGroupPage />
                </RoleGate>
              }
            />
            <Route
              path="grupos/:slug"
              element={
                <RoleGate allow={["inquilino"]}>
                  <GroupDetailPage />
                </RoleGate>
              }
            />

            <Route
              path="panel"
              element={
                <RoleGate allow={["anfitrion", "propietario", "agencia"]}>
                  <PanelDashboardPage />
                </RoleGate>
              }
            />
            <Route
              path="panel/espacios"
              element={
                <RoleGate allow={["anfitrion", "propietario", "agencia"]}>
                  <ListingsRouterPage />
                </RoleGate>
              }
            />
            <Route
              path="panel/espacios/nuevo"
              element={
                <RoleGate allow={["anfitrion", "propietario", "agencia"]}>
                  <ListingEditorPage />
                </RoleGate>
              }
            />
            <Route
              path="panel/espacios/:id/editar"
              element={
                <RoleGate allow={["anfitrion", "propietario", "agencia"]}>
                  <ListingEditorPage />
                </RoleGate>
              }
            />
            <Route
              path="panel/espacios/:id/acceso"
              element={
                <RoleGate allow={["propietario", "agencia"]}>
                  <ListingAccessPage />
                </RoleGate>
              }
            />
            <Route
              path="panel/solicitudes"
              element={
                <RoleGate allow={["anfitrion", "propietario", "agencia"]}>
                  <ReviewApplicationsPage />
                </RoleGate>
              }
            />
            <Route
              path="panel/convivencia"
              element={
                <RoleGate allow={["anfitrion"]}>
                  <PanelConvivenciaPage />
                </RoleGate>
              }
            />
          </Route>
        </Route>

        <Route
          element={
            <RequireAuth>
              <AdminGate>
                <AdminLayout />
              </AdminGate>
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/espacios" element={<AdminListingsPage />} />
          <Route path="/admin/reportes" element={<AdminReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { lazy, type ComponentType } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ScrollReset } from "./components/ScrollReset";
import { FunnelLayout } from "./components/FunnelLayout";
import { PublicLayout } from "./components/PublicLayout";
import { RequireAuth } from "./components/RequireAuth";
import { RoleGate } from "./components/RoleGate";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { AdminLayout } from "./components/AdminLayout";
import { AdminGate } from "./components/AdminGate";
import { RouteProgress } from "./components/RouteProgress";
import { Toaster } from "sileo";
import { NotificationToasts } from "./components/NotificationToasts";
import { I18nProvider } from "./lib/I18nContext";
// AuthCallbackPage queda con import estático: ruta crítica de auth sin layout
// (ni Suspense) por encima, evitando cualquier boundary de suspensión.
import { AuthCallbackPage } from "./pages/AuthCallbackPage";

/** Adapta exports nombrados a React.lazy (code-splitting por ruta). */
const lazily = <T extends Record<string, unknown>>(
  factory: () => Promise<T>,
  name: keyof T,
): ReturnType<typeof lazy> =>
  lazy(() => factory().then((m) => ({ default: m[name] as ComponentType })));

const DiscoverPage = lazily(() => import("./pages/DiscoverPage"), "DiscoverPage");
const PropertyDetailPage = lazily(
  () => import("./pages/PropertyDetailPage"),
  "PropertyDetailPage",
);
const MatchesPage = lazily(() => import("./pages/MatchesPage"), "MatchesPage");
const ProfilePage = lazily(() => import("./pages/ProfilePage"), "ProfilePage");
const MessagesPage = lazily(() => import("./pages/MessagesPage"), "MessagesPage");
const AccessPage = lazily(() => import("./pages/AccessPage"), "AccessPage");
const OnboardingPage = lazily(() => import("./pages/OnboardingPage"), "OnboardingPage");
const CompleteAccountRolePage = lazily(
  () => import("./pages/CompleteAccountRolePage"),
  "CompleteAccountRolePage",
);
const PanelDashboardPage = lazily(
  () => import("./pages/panel/PanelDashboardPage"),
  "PanelDashboardPage",
);
const ListingsRouterPage = lazily(
  () => import("./pages/panel/ListingsRouterPage"),
  "ListingsRouterPage",
);
const ListingEditorPage = lazily(
  () => import("./pages/panel/ListingEditorPage"),
  "ListingEditorPage",
);
const ReviewApplicationsPage = lazily(
  () => import("./pages/panel/ReviewApplicationsPage"),
  "ReviewApplicationsPage",
);
const PanelConvivenciaPage = lazily(
  () => import("./pages/panel/PanelConvivenciaPage"),
  "PanelConvivenciaPage",
);
const PanelInquilinosPage = lazily(
  () => import("./pages/panel/PanelInquilinosPage"),
  "PanelInquilinosPage",
);
const ListingAccessPage = lazily(
  () => import("./pages/panel/ListingAccessPage"),
  "ListingAccessPage",
);
const LandingPage = lazily(() => import("./pages/public/LandingPage"), "LandingPage");
const PublicListingsPage = lazily(
  () => import("./pages/public/PublicListingsPage"),
  "PublicListingsPage",
);
const ListingsLegacyRedirect = lazily(
  () => import("./pages/public/ListingsLegacyRedirect"),
  "ListingsLegacyRedirect",
);
const HostLandingPage = lazily(
  () => import("./pages/public/HostLandingPage"),
  "HostLandingPage",
);
const OwnerLandingPage = lazily(
  () => import("./pages/public/OwnerLandingPage"),
  "OwnerLandingPage",
);
const AgencyLandingPage = lazily(
  () => import("./pages/public/AgencyLandingPage"),
  "AgencyLandingPage",
);
const HowItWorksPage = lazily(
  () => import("./pages/public/HowItWorksPage"),
  "HowItWorksPage",
);
const DocumentationPage = lazily(
  () => import("./pages/public/DocumentationPage"),
  "DocumentationPage",
);
const HelpPage = lazily(() => import("./pages/public/HelpPage"), "HelpPage");
const CalculadoraAlquilerPage = lazily(
  () => import("./pages/public/CalculadoraAlquilerPage"),
  "CalculadoraAlquilerPage",
);
const ForgotPasswordPage = lazily(
  () => import("./pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const CommunityPage = lazily(() => import("./pages/CommunityPage"), "CommunityPage");
const CompatibilityQuizPage = lazily(
  () => import("./pages/CompatibilityQuizPage"),
  "CompatibilityQuizPage",
);
const ProfileEditPage = lazily(
  () => import("./pages/ProfileEditPage"),
  "ProfileEditPage",
);
const MemberPublicPage = lazily(
  () => import("./pages/MemberPublicPage"),
  "MemberPublicPage",
);
const GroupDetailPage = lazily(() => import("./pages/GroupDetailPage"), "GroupDetailPage");
const CreateGroupPage = lazily(() => import("./pages/CreateGroupPage"), "CreateGroupPage");
const GroupsPage = lazily(() => import("./pages/GroupsPage"), "GroupsPage");
const GroupInvitePage = lazily(
  () => import("./pages/GroupInvitePage"),
  "GroupInvitePage",
);
const NotificationsPage = lazily(
  () => import("./pages/NotificationsPage"),
  "NotificationsPage",
);
const ReferidosPage = lazily(() => import("./pages/ReferidosPage"), "ReferidosPage");
const VerificationPage = lazily(
  () => import("./pages/VerificationPage"),
  "VerificationPage",
);
const EmbajadoresPage = lazily(
  () => import("./pages/embajadores/EmbajadoresPage"),
  "EmbajadoresPage",
);
const LegalPage = lazily(() => import("./pages/legal/LegalPage"), "LegalPage");
const BlogPage = lazily(() => import("./pages/blog/BlogPage"), "BlogPage");
const BlogPostPage = lazily(() => import("./pages/blog/BlogPostPage"), "BlogPostPage");
const AdminDashboardPage = lazily(
  () => import("./pages/admin/AdminDashboardPage"),
  "AdminDashboardPage",
);
const AdminUsersPage = lazily(
  () => import("./pages/admin/AdminUsersPage"),
  "AdminUsersPage",
);
const AdminUserDetailPage = lazily(
  () => import("./pages/admin/AdminUserDetailPage"),
  "AdminUserDetailPage",
);
const AdminListingsPage = lazily(
  () => import("./pages/admin/AdminListingsPage"),
  "AdminListingsPage",
);
const AdminReportsPage = lazily(
  () => import("./pages/admin/AdminReportsPage"),
  "AdminReportsPage",
);
const AdminEmbajadoresPage = lazily(
  () => import("./pages/admin/AdminEmbajadoresPage"),
  "AdminEmbajadoresPage",
);
const AdminComisionesPage = lazily(
  () => import("./pages/admin/AdminComisionesPage"),
  "AdminComisionesPage",
);
const AdminRoomAssignmentsPage = lazily(
  () => import("./pages/admin/AdminRoomAssignmentsPage"),
  "AdminRoomAssignmentsPage",
);
const AdminMatchingPage = lazily(
  () => import("./pages/admin/AdminMatchingPage"),
  "AdminMatchingPage",
);
const AdminSolicitudesPage = lazily(
  () => import("./pages/admin/AdminSolicitudesPage"),
  "AdminSolicitudesPage",
);
const AdminGruposPage = lazily(
  () => import("./pages/admin/AdminGruposPage"),
  "AdminGruposPage",
);
const AdminAuditoriaPage = lazily(
  () => import("./pages/admin/AdminAuditoriaPage"),
  "AdminAuditoriaPage",
);
const AdminNotificacionesPage = lazily(
  () => import("./pages/admin/AdminNotificacionesPage"),
  "AdminNotificacionesPage",
);
const AdminConfiguracionPage = lazily(
  () => import("./pages/admin/AdminConfiguracionPage"),
  "AdminConfiguracionPage",
);
const AdminVerificationsPage = lazily(
  () => import("./pages/admin/AdminVerificationsPage"),
  "AdminVerificationsPage",
);
const AdminAIPage = lazily(() => import("./pages/admin/AdminAIPage"), "AdminAIPage");

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
    <I18nProvider>
      <BrowserRouter>
        <Toaster position="top-right" offset={{ top: 72, right: 16 }} theme="light" />
        <NotificationToasts />
        <ScrollReset />
        <RouteProgress />
        <PWAInstallPrompt />
        <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="alojamientos" element={<PublicListingsPage />} />
          <Route path="listings" element={<ListingsLegacyRedirect />} />
          <Route path="anfitriones" element={<HostLandingPage />} />
          <Route path="propietarios" element={<OwnerLandingPage />} />
          <Route path="operadores" element={<AgencyLandingPage />} />
          <Route path="agencias" element={<Navigate to="/operadores" replace />} />
          <Route path="documentacion" element={<DocumentationPage />} />
          <Route path="docs" element={<Navigate to="/documentacion" replace />} />
          <Route path="ayuda" element={<HelpPage />} />
          <Route path="como-funciona" element={<HowItWorksPage />} />
          <Route path="calculadora-alquiler" element={<CalculadoraAlquilerPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="invitar/grupo/:slug" element={<GroupInvitePage />} />
          <Route path="privacidad" element={<LegalPage kind="privacy" />} />
          <Route path="terminos" element={<LegalPage kind="terms" />} />
          <Route path="aviso-legal" element={<LegalPage kind="notice" />} />
        </Route>

        <Route element={<FunnelLayout />}>
          <Route path="/access" element={<AccessPage />} />
          <Route path="/olvide-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/verificacion" element={<VerificationPage />} />
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
            <Route path="notifications" element={<NotificationsPage />} />
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
              path="panel/inquilinos"
              element={
                <RoleGate allow={["propietario", "agencia"]}>
                  <PanelInquilinosPage />
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
            <Route
              path="embajadores"
              element={
                <RoleGate allow={["embajador"]}>
                  <EmbajadoresPage />
                </RoleGate>
              }
            />
            <Route path="referidos" element={<ReferidosPage />} />
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
          <Route path="/admin/usuarios/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/embajadores" element={<AdminEmbajadoresPage />} />
          <Route path="/admin/comisiones" element={<AdminComisionesPage />} />
          <Route path="/admin/habitaciones" element={<AdminRoomAssignmentsPage />} />
          <Route path="/admin/matching" element={<AdminMatchingPage />} />
          <Route path="/admin/solicitudes" element={<AdminSolicitudesPage />} />
          <Route path="/admin/espacios" element={<AdminListingsPage />} />
          <Route path="/admin/grupos" element={<AdminGruposPage />} />
          <Route path="/admin/reportes" element={<AdminReportsPage />} />
          <Route path="/admin/notificaciones" element={<AdminNotificacionesPage />} />
          <Route path="/admin/configuracion" element={<AdminConfiguracionPage />} />
          <Route path="/admin/auditoria" element={<AdminAuditoriaPage />} />
          <Route path="/admin/verificaciones" element={<AdminVerificationsPage />} />
          <Route path="/admin/ia" element={<AdminAIPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

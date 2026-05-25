export { initHabitus, getSupabase, isHabitusConfigured } from "./client";

export * from "./types/models";
export * from "./types/compatibility";
export type { Database } from "./types/database";
export {
  EMPTY_SEARCH_PREFS,
  normalizeSearchPrefs,
  searchPrefsDiscoverLocation,
  type SearchPrefs,
  type SearchCity,
} from "./types/searchPrefs";

export { es } from "./i18n/es";

export {
  formatPrice,
  formatAvailableDate,
  formatAppliedDate,
  formatMessageTime,
  translateAuthError,
  currencySymbol,
  applicationStatusLabel,
  applicationStatusClass,
} from "./lib/format";
export { slugify } from "./lib/slug";
export { buildProfileSlug, isUuidLike } from "./lib/profileSlug";
export {
  DEFAULT_FLOOR_PROPERTY_TYPE,
  FLOOR_PROPERTY_TYPES,
} from "./lib/floorPropertyTypes";
export {
  profileNeedsOnboarding,
  profileNeedsProfileSetup,
  roleNeedsCompatQuiz,
  roleShowsLifestyleProfile,
  roleShowsTrustProfile,
  profileNeedsCompatQuiz,
  ageFromBirthDate,
  isValidOnboardingAge,
  PROFILE_SETUP_PATH,
  HOST_FIRST_LISTING_PATH,
} from "./lib/onboarding";
export {
  isValidReturnPath,
  isPropertyReturnPath,
  isAuthFunnelStep,
} from "./lib/returnTo";
export { listingStatusLabel, listingStatusClass } from "./lib/listingStatus";
export { listingCopyForRole, type ListingCopy } from "./lib/listingCopy";
export { ALL_CATEGORY_SLUG, buildCategoryFilters } from "./lib/categories";
export { PLACEHOLDER_IMAGE, normalizeImageUrl, imageUrlOrPlaceholder } from "./lib/media";
export {
  resolveSiteOrigin,
  buildGroupInviteUrl,
  buildReferralUrl,
  copyToClipboard,
  shareLink,
  whatsAppShareUrl,
  mailShareUrl,
  shareGroupInviteText,
  shareReferralText,
  type SharePayload,
} from "./lib/share";
export {
  PENDING_GROUP_SLUG_KEY,
  PENDING_REFERRAL_KEY,
  persistPendingGroupSlug,
  consumePendingGroupSlug,
  peekPendingGroupSlug,
  persistPendingReferral,
  consumePendingReferral,
  peekPendingReferral,
  parseReferralCode,
  parseGroupSlugParam,
} from "./lib/pendingInvite";

export {
  COMPAT_QUIZ_QUESTIONS,
  DEMO_QUIZ_BY_SLUG,
  questionsForRole,
  type QuizOption,
  type QuizQuestion,
} from "./data/compatibilityQuiz";

export {
  PROFILE_LIFESTYLE_TAGS,
  lifestyleTagLabel,
  normalizeLifestyleTags,
  type ProfileLifestyleTag,
} from "./data/profileTags";

export { LISTING_AMENITY_PRESETS } from "./data/listingAmenities";

export {
  USERS_CSV_HEADERS,
  LISTINGS_CSV_HEADERS,
  usersCsvExample,
  listingsCsvExample,
} from "./data/adminImportTemplates";

export { parseCsv, parseCsvRecords, rowsToCsv, downloadCsv } from "./lib/csv";

export {
  homePathForRole,
  homePathForProfile,
  homeScreenForRole,
  navItemsForRole,
  bottomNavItemsForRole,
  primaryNavItemsForRole,
  secondaryNavItemsForRole,
  MAX_BOTTOM_NAV_ITEMS,
  canAccessPath,
  type NavItem,
  type PrimaryNavItem,
} from "./config/roleNavigation";
export {
  mobileTabsForRole,
  defaultMobileScreenForRole,
  type MobileTab,
} from "./config/mobileNavigation";

export {
  ACCOUNT_ROLES,
  accountRoleLabel,
  type AccountRoleOption,
} from "./services/accountRoles";
export * from "./services/admin";
export * from "./services/adminImport";
export * from "./services/applications";
export * from "./services/blog";
export * from "./services/bookmarks";
export * from "./services/community";
export * from "./services/compatibility";
export * from "./services/compatibilityQuiz";
export * from "./services/dashboard";
export * from "./services/hostPanel";
export type { PublicMember } from "./services/members";
export * from "./services/members";
export * from "./services/messages";
export * from "./services/ownerListings";
export {
  computeProfileScore,
  fetchProfileDetails,
  fetchProfileEditData,
  fetchProfileTags,
  fetchSearchPrefs,
  updateProfile,
  completeOnboarding,
  requestIdentityVerification,
  completeIdentityVerificationDemo,
  deleteOwnAccount,
  type ProfileUpdateInput,
  type ProfileEditData,
  type OnboardingInput,
} from "./services/profile";
export {
  OAUTH_PROVIDERS,
  toSupabaseProvider,
  displayNameFromAuthUser,
  ensureProfileForAuthUser,
  postAuthRedirectPath,
  requestPasswordReset,
  type OAuthProvider,
} from "./services/auth";
export * from "./services/properties";
export * from "./services/groups";
export * from "./services/listingAccess";
export * from "./services/referrals";
export * from "./services/consents";
export * from "./services/expenses";
export * from "./services/leases";
export * from "./services/moonAccess";
export * from "./services/notifications";
export * from "./services/storage";

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
  roleNeedsCompatQuiz,
  roleShowsLifestyleProfile,
  roleShowsTrustProfile,
  profileNeedsCompatQuiz,
  ageFromBirthDate,
  isValidOnboardingAge,
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
export * from "./services/storage";

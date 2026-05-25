import type { CompatibilityResult, MatchKind } from "./compatibility";

export type IdentityStatus = "none" | "pending" | "verified";
/** Mismo flujo demo que identidad, aplicado al inmueble publicado. */
export type PropertyVerificationStatus = IdentityStatus;
export type ListingVisibility = "public" | "private";
export type CompatibilityMode = "host" | "owner_only" | "none";

export type PropertyHost = {
  id: string;
  slug: string;
  name: string;
  image: string;
  roleTitle: string | null;
  identityStatus: IdentityStatus;
};

export type Amenity = { icon: string; label: string };

export type Property = {
  id: string;
  slug: string;
  uuid?: string;
  name: string;
  location: string;
  city: string | null;
  price: number;
  currency: string;
  currencySymbol: string;
  compatibility: number | null;
  compatibilityResult?: CompatibilityResult;
  compatibilityMode: CompatibilityMode;
  image: string;
  amenities: Amenity[];
  availableFrom: string | null;
  roomType: string | null;
  description: string | null;
  categorySlug: string | null;
  categoryLabel: string | null;
  visibility: ListingVisibility;
  host: PropertyHost | null;
  listingConditions: string | null;
  propertyVerificationStatus: PropertyVerificationStatus;
  ownerIdentityStatus: IdentityStatus | null;
};

export type Category = {
  id: string;
  slug: string;
  label: string;
};

export type Roommate = {
  id: string;
  slug: string;
  uuid?: string;
  name: string;
  role: string;
  compatibility: number;
  compatibilityResult?: CompatibilityResult;
  matchKind?: MatchKind;
  image: string;
  tags: string[];
  quote: string;
  isDemo?: boolean;
};

export type Application = {
  id: string;
  propertyName: string;
  propertyImage: string;
  status: string;
  statusKey: string;
  statusClass: string;
  date: string;
  progress: number;
};

export type AccountRoleSlug = "inquilino" | "anfitrion" | "propietario" | "agencia";

export type Profile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  profileScore: number;
  roleTitle: string | null;
  accountRole: AccountRoleSlug | null;
  bioQuote: string | null;
  isDiscoverable: boolean;
  isAdmin: boolean;
  identityStatus: IdentityStatus;
  birthDate: string | null;
  onboardingCompletedAt: string | null;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: string;
  tags: string[];
};

export type CommunityEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  city: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  coverImageUrl: string | null;
  maxAttendees: number | null;
};

export type AdminReport = {
  id: string;
  reporterId: string | null;
  targetType: "profile" | "listing" | "message";
  targetId: string;
  reason: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  adminNotes: string | null;
  createdAt: string;
};

export type AdminUserRow = {
  id: string;
  displayName: string;
  email: string | null;
  accountRole: AccountRoleSlug | null;
  profileScore: number;
  isAdmin: boolean;
  isDiscoverable: boolean;
  identityStatus: IdentityStatus;
  createdAt: string;
};

export type Conversation = {
  id: string;
  otherUserId: string;
  otherName: string;
  otherAvatar: string | null;
  otherRole: string | null;
  lastMessage: string;
  lastMessageAt: string;
  isOwnLastMessage: boolean;
};

export type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
};

export type LivingGroup = {
  id: string;
  slug: string;
  name: string;
  creatorId: string;
  listingId: string | null;
  city: string | null;
  status: "forming" | "ready" | "active" | "archived";
  targetMembers: number;
  notes: string | null;
  memberCount: number;
  createdAt: string;
};

export type LivingGroupMember = {
  profileId: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  identityStatus: IdentityStatus;
  roleTitle: string | null;
  groupRole: "lead" | "member";
  roomLabel: string | null;
  shareAmount: number | null;
  isConfirmed: boolean;
  joinedAt: string;
};

export type ListingAccessGrant = {
  id: string;
  listingId: string;
  groupId: string | null;
  groupName: string | null;
  groupSlug: string | null;
  profileId: string | null;
  profileName: string | null;
  profileSlug: string | null;
  grantedAt: string;
};

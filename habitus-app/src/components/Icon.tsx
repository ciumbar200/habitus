import type { ComponentType } from "react";
import * as PhosphorIcons from "@phosphor-icons/react";

type IconName = keyof typeof PhosphorIcons;

type IconProps = {
  name: string;
  className?: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill";
  /** Compatibilidad con uso previo: activa weight="fill" */
  filled?: boolean;
};

/** Nombres Material / internos → iconos Phosphor */
const iconMapping: Record<string, IconName> = {
  arrow_forward: "ArrowRight",
  arrow_back: "ArrowLeft",
  arrow_left: "ArrowLeft",
  chevron_right: "CaretRight",
  chevron_left: "CaretLeft",
  expand_more: "CaretDown",
  expand_less: "CaretUp",
  check: "Check",
  check_circle: "CheckCircle",
  close: "X",
  add: "Plus",
  remove: "Minus",
  edit: "PencilSimple",
  delete: "Trash",
  save: "FloppyDisk",
  search: "MagnifyingGlass",
  home: "House",
  menu: "List",
  notifications: "Bell",
  chat: "ChatCircle",
  chat_bubble: "ChatCircle",
  mail: "Envelope",
  phone: "Phone",
  calendar: "Calendar",
  calendar_month: "Calendar",
  map_pin: "MapPin",
  location_on: "MapPin",
  star: "Star",
  star_fill: "Star",
  favorite: "Heart",
  bookmark: "BookmarkSimple",
  bookmark_fill: "BookmarkSimple",
  info: "Info",
  warning: "Warning",
  error: "XCircle",
  success: "CheckCircle",
  account: "User",
  person: "User",
  person_remove: "UserMinus",
  person_search: "UserList",
  lock: "Lock",
  visibility: "Eye",
  visibility_off: "EyeSlash",
  send: "PaperPlaneRight",
  attach: "Paperclip",
  image: "Image",
  camera: "Camera",
  mic: "Microphone",
  video: "VideoCamera",
  share: "ShareNetwork",
  filter: "Funnel",
  sort: "ArrowsDownUp",
  refresh: "ArrowClockwise",
  download: "DownloadSimple",
  upload: "UploadSimple",
  cloud_upload: "CloudArrowUp",
  add_photo_alternate: "Images",
  print: "Printer",
  link: "Link",
  copy: "Copy",
  settings: "Gear",
  help: "Question",
  logout: "SignOut",
  login: "SignIn",
  bolt: "Lightning",
  pending: "Clock",
  hourglass_top: "HourglassMedium",
  progress_activity: "CircleNotch",
  shield: "Shield",
  verified_user: "SealCheck",
  admin_panel_settings: "ShieldCheck",
  explore: "Compass",
  dashboard: "SquaresFour",
  group: "Users",
  groups: "UsersThree",
  home_work: "HouseLine",
  apartment: "Buildings",
  domain: "Buildings",
  business_center: "Briefcase",
  real_estate_agent: "House",
  assignment: "ClipboardText",
  payments: "CurrencyEur",
  flag: "Flag",
  article: "Article",
  event: "CalendarBlank",
  edit_note: "NotePencil",
  wifi: "WifiHigh",
  kitchen: "CookingPot",
  balcony: "SunHorizon",
  local_laundry_service: "WashingMachine",
  desk: "Desk",
  cleaning_services: "Broom",
  pets: "PawPrint",
  volume_off: "SpeakerSlash",
};

export function Icon({
  name,
  className = "",
  size = 24,
  weight: weightProp,
  filled,
}: IconProps) {
  const normalizedName = name.replace(/-/g, "_");
  const phosphorName =
    iconMapping[normalizedName] ?? iconMapping[name] ?? (tryPascalCase(name) as IconName | undefined);

  const weight = weightProp ?? (filled ? "fill" : "regular");

  if (!phosphorName) {
    const Fallback = PhosphorIcons.Question as ComponentType<{
      size?: number;
      weight?: IconProps["weight"];
      className?: string;
    }>;
    return <Fallback size={size} weight={weight} className={className} aria-hidden />;
  }

  const IconComponent = (PhosphorIcons as unknown as Record<string, ComponentType<{
    size?: number;
    weight?: IconProps["weight"];
    className?: string;
  }>>)[phosphorName];

  if (!IconComponent) {
    const Fallback = PhosphorIcons.Question;
    return <Fallback size={size} weight={weight} className={className} aria-hidden />;
  }

  return <IconComponent size={size} weight={weight} className={className} aria-hidden />;
}

/** snake_case → PascalCase por si el nombre ya es de Phosphor */
function tryPascalCase(name: string): string | undefined {
  const pascal = name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return pascal in PhosphorIcons ? pascal : undefined;
}

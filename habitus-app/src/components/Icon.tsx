import * as PhosphorIcons from "@phosphor-icons/react";

type IconName = keyof typeof PhosphorIcons;

type IconProps = {
  name: string;
  className?: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill";
};

// Mapping para nombres compatibles con el código existente
const iconMapping: Record<string, IconName> = {
  arrow_forward: "ArrowRight",
  check: "Check",
  check_circle: "CheckCircle",
  favorite: "Heart",
  home: "House",
  search: "MagnifyingGlass",
  close: "X",
  menu: "List",
  notifications: "Bell",
  chat: "ChatCircle",
  mail: "Envelope",
  phone: "Phone",
  calendar: "Calendar",
  map_pin: "MapPin",
  star: "Star",
  star_fill: "StarFill",
  edit: "Pencil",
  delete: "Trash",
  add: "Plus",
  remove: "Minus",
  expand_more: "CaretDown",
  expand_less: "CaretUp",
  chevron_right: "CaretRight",
  chevron_left: "CaretLeft",
  info: "Info",
  warning: "Warning",
  error: "XCircle",
  success: "CheckCircle",
  account: "User",
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
  bookmark: "Bookmark",
  bookmark_fill: "BookmarkSimple",
  filter: "Funnel",
  sort: "ArrowsDownUp",
  refresh: "ArrowClockwise",
  download: "DownloadSimple",
  upload: "UploadSimple",
  print: "Printer",
  link: "Link",
  copy: "Copy",
  settings: "Gear",
  help: "Question",
  logout: "SignOut",
  login: "SignIn",
};

export function Icon({ name, className = "", size = 24, weight = "regular" }: IconProps) {
  // Normalizar el nombre (reemplazar guiones por guiones bajos para buscar en el mapping)
  const normalizedName = name.replace(/-/g, "_");
  const phosphorName = iconMapping[normalizedName] || (iconMapping[name as keyof typeof iconMapping] as IconName);

  if (!phosphorName) {
    // Fallback para iconos no mapeados
    return <span className={className}>{name}</span>;
  }

  const IconComponent = (PhosphorIcons as any)[phosphorName];

  if (!IconComponent) {
    return <span className={className}>{name}</span>;
  }

  return (
    <IconComponent
      size={size}
      weight={weight}
      className={className}
    />
  );
}

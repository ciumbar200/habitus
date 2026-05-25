import {
  es,
  getDefaultZoneForCity,
  getZonesForCity,
  MOON_CITIES,
  type MoonCitySlug,
} from "@habitus/core";

type Props = {
  city: MoonCitySlug | "";
  zone: string;
  onCityChange: (city: MoonCitySlug | "") => void;
  onZoneChange: (zone: string) => void;
  cityOptional?: boolean;
  zoneOptional?: boolean;
  disabled?: boolean;
  className?: string;
};

export function CityZoneSelect({
  city,
  zone,
  onCityChange,
  onZoneChange,
  cityOptional = false,
  zoneOptional = false,
  disabled = false,
  className = "",
}: Props) {
  const loc = es.discover;
  const zones = city ? getZonesForCity(city) : [];

  function handleCityChange(next: string) {
    const citySlug = (next || "") as MoonCitySlug | "";
    onCityChange(citySlug);
    if (citySlug) {
      onZoneChange(getDefaultZoneForCity(citySlug));
    } else {
      onZoneChange("");
    }
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`.trim()}>
      <div>
        <label className="mb-1.5 block text-label-md text-deep-navy">{loc.location}</label>
        <select
          value={city}
          disabled={disabled}
          onChange={(e) => handleCityChange(e.target.value)}
          className="field-input"
        >
          {cityOptional && <option value="">{es.editProfile.cityAny}</option>}
          {MOON_CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-label-md text-deep-navy">{loc.zone}</label>
        <select
          value={zone}
          disabled={disabled || !city}
          onChange={(e) => onZoneChange(e.target.value)}
          className="field-input"
        >
          {zoneOptional && <option value="">{loc.zoneAll}</option>}
          {zones.map((z) => (
            <option key={z.slug} value={z.slug}>
              {z.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

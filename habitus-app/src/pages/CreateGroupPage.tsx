import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { es, createGroup, getDefaultZoneForCity, type MoonCitySlug } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { CityZoneSelect } from "../components/location/CityZoneSelect";

export function CreateGroupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState<MoonCitySlug | "">("barcelona");
  const [zone, setZone] = useState(getDefaultZoneForCity("barcelona"));
  const [targetMembers, setTargetMembers] = useState(3);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !name.trim()) return;
    setSaving(true);
    setError(null);
    const { group, error: err } = await createGroup(user.id, {
      name: name.trim(),
      city: city || undefined,
      zone,
      targetMembers,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (err || !group) {
      setError(err ?? es.common.errorLoad);
      return;
    }
    navigate(`/grupos/${group.slug}`, { state: { justCreated: true } });
  }

  return (
    <main className="mx-auto max-w-lg px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <h1 className="text-headline-lg text-deep-navy">{es.groups.createTitle}</h1>
      <p className="mt-2 text-body-md text-warm-slate">{es.groups.subtitle}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-label-md text-deep-navy">{es.groups.name}</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
            placeholder="Ej. Grupo Erasmus Gràcia"
          />
        </div>
        <CityZoneSelect
          city={city}
          zone={zone}
          onCityChange={setCity}
          onZoneChange={setZone}
        />
        <div>
          <label className="mb-1.5 block text-label-md text-deep-navy">{es.groups.targetMembers}</label>
          <input
            type="number"
            min={2}
            max={8}
            value={targetMembers}
            onChange={(e) => setTargetMembers(Number(e.target.value))}
            className="field-input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-label-md text-deep-navy">{es.groups.notes}</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="field-input"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-deep-navy py-3 text-label-md text-on-primary disabled:opacity-60"
        >
          {saving ? es.common.pleaseWait : es.groups.create}
        </button>
      </form>
    </main>
  );
}

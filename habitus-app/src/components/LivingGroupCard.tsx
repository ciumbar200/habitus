import { Link } from "react-router-dom";
import { es } from "@habitus/core";
import type { LivingGroup } from "@habitus/core";
import { Icon } from "./Icon";

type LivingGroupCardProps = {
  group: LivingGroup;
};

export function LivingGroupCard({ group }: LivingGroupCardProps) {
  const statusLabel = es.groups.status[group.status];
  return (
    <Link
      to={`/grupos/${group.slug}`}
      className="block rounded-xl border border-border-light bg-surface-container-lowest p-5 transition-shadow hover:shadow-md card-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-headline-md text-deep-navy">{group.name}</h3>
          {group.city && (
            <p className="mt-1 flex items-center gap-1 text-body-sm text-warm-slate">
              <Icon name="location_on" className="text-[16px]" />
              {group.city}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 text-label-sm text-deep-navy">
          {statusLabel}
        </span>
      </div>
      <p className="mt-3 text-body-sm text-warm-slate">
        {group.memberCount}/{group.targetMembers} {es.groups.members}
      </p>
    </Link>
  );
}

import type { LabTestMean } from "@/lib/types";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";
import BadgeQualitySeal from "./BadgeQualitySeal";
import ChipComplexity from "./ChipComplexity";
import ChipAccessControl from "./ChipAccessControl";
import ChipCapabilities from "./ChipCapabilities";
import ManagerCard from "./ManagerCard";
import CountryMapIcon from "./icons/CountryMapIcon";
import AircraftProgramTile from "./AircraftProgramTile";
import AtaTile from "./AtaTile";
import LifecycleSection from "./detail/LifecycleSection";
import LinkIcon from "./icons/LinkIcon";

/** One identifier of the bench: link icon, "Label : value", in an accent-tinted pill. */
function IdentifierPill({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <span className="flex w-full items-center gap-1.5 rounded-md border border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-2.5 py-0.5 text-xs font-semibold text-fg">
      <LinkIcon size={13} className="shrink-0 text-accent" />
      <span>
        {label} : <span className="font-bold">{value}</span>
      </span>
    </span>
  );
}

export default function LabTestMeanHeader({
  labTestMean,
}: Readonly<{
  labTestMean: LabTestMean;
}>) {
  const m = labTestMean;
  const projectManager = m.roles.projectManagers?.[0];

  const city = m.location.city?.trim() || null;
  const subParts = [m.location.building, m.location.room].filter(
    (s): s is string => !!s && s.length > 0,
  );

  return (
    <header className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
          {m.name}
        </h1>
        <div className="flex items-center flex-wrap gap-3">
          <BadgeStatus status={m.status} withIcon />
          <BadgeQualitySeal lxState={m.lxState} />
        </div>
        {/* The two identifiers, one pill each, stacked (temp/f1.jpg). The
            inline grid is as wide as the longer pill and every pill fills
            it, so both frames share one width. A missing one shows no pill. */}
        {(m.externalId || m.functionalCode) && (
          <div className="inline-grid gap-1 pt-2">
            {m.externalId && <IdentifierPill label="External Ref" value={m.externalId} />}
            {m.functionalCode && (
              <IdentifierPill label="Functional Code" value={m.functionalCode} />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ChipType type={m.type} withIcon />
        <ChipComplexity level={m.complexity} />
        <ChipAccessControl enabled={m.security.accesscontrol} />
        <ChipCapabilities capabilities={m.technicalCapabilities} />
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <div className="flex flex-col items-start gap-3 shrink-0">
          <div className="flex flex-col items-center gap-1" style={{ width: 200 }}>
            <CountryMapIcon
              country={m.location.country}
              site={m.location.site}
            />
            {(city || subParts.length > 0) && (
              <div className="flex flex-col items-center gap-0.5">
                {city && (
                  <span className="text-sm text-fg text-center">{city}</span>
                )}
                {subParts.length > 0 && (
                  <span className="text-xs text-muted text-center">
                    {subParts.join(" · ")}
                  </span>
                )}
              </div>
            )}
          </div>
          {(m.programs.length > 0 || m.atas.length > 0) && (
            <div
              className="grid grid-cols-3 gap-3"
              style={{ width: 200 }}
            >
              {m.programs.map((p) => (
                <AircraftProgramTile key={`prog-${p}`} code={p} />
              ))}
              {m.atas.map((code) => (
                <AtaTile key={`ata-${code}`} code={code} />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 w-full">
          <LifecycleSection lifecycle={m.lifecycle} />
        </div>
      </div>

      {(m.manager || projectManager) && (
        <div className="flex flex-col gap-3 pt-2 max-w-detail-info">
          {m.manager && (
            <ManagerCard
              name={m.manager.name}
              email={m.manager.email}
              roleLabel="Bench Manager"
            />
          )}
          {projectManager && (
            <ManagerCard
              name={projectManager.name}
              email={projectManager.email}
              roleLabel="Project Manager"
            />
          )}
        </div>
      )}
    </header>
  );
}

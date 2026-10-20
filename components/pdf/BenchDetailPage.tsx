import { Page, Text, View, Link, Image } from "@react-pdf/renderer";
import type { LabTestMean } from "@/lib/types";
import {
  styles,
  colors,
  statusColor,
  lifecycleColor,
  avatarColor,
  initials,
} from "./styles";
import {
  PdfTypeIcon,
  PdfComplexityIcon,
  PdfAccessIcon,
  PdfRemoteIcon,
  PdfAircraftIcon,
  PdfAtaIcon,
  PdfCountryMap,
  PdfKickoffIcon,
  PdfInServiceIcon,
  PdfMothballedIcon,
  PdfDismantledIcon,
} from "./icons";
import { STATUS_LABELS, COMPLEXITY_LABELS, TYPE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format-date";
import { labTestMeanHref } from "@/lib/labTestMeanHref";

type ResolvedBench = LabTestMean & { resolvedCover: string | null };

type Props = {
  banc: ResolvedBench;
  baseUrl: string;
};

function triStateLabel(
  value: boolean | null,
  onLabel: string,
  offLabel: string,
  naLabel: string,
): string {
  if (value === true) return onLabel;
  if (value === false) return offLabel;
  return naLabel;
}

function Section({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.h3}>{title}</Text>
      <View style={{ marginTop: 4 }}>{children}</View>
    </View>
  );
}

// One "icon + label" attribute (header: Complexity / Access / Remote).
function IconLabel({
  icon,
  label,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
}>) {
  return (
    <View style={styles.iconLabel}>
      {icon}
      <Text style={styles.body}>{label}</Text>
    </View>
  );
}

type StepKey = "kickoff" | "inService" | "mothballed" | "dismantled";

const LIFECYCLE_STEPS: {
  key: StepKey;
  label: string;
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  reached: (d: string) => string;
  unreached: string;
}[] = [
  {
    key: "kickoff",
    label: "Kickoff",
    Icon: PdfKickoffIcon,
    reached: (d) => `Project started in ${d}`,
    unreached: "Not started",
  },
  {
    key: "inService",
    label: "In Service",
    Icon: PdfInServiceIcon,
    reached: (d) => `Operational since ${d}`,
    unreached: "Not yet in service",
  },
  {
    key: "mothballed",
    label: "Mothballed",
    Icon: PdfMothballedIcon,
    reached: (d) => `Mothballed since ${d}`,
    unreached: "Not mothballed",
  },
  {
    key: "dismantled",
    label: "Dismantled",
    Icon: PdfDismantledIcon,
    reached: (d) => `Dismantled in ${d}`,
    unreached: "Still in service",
  },
];

export default function BenchDetailPage({ banc, baseUrl }: Readonly<Props>) {
  const status = STATUS_LABELS[banc.status] ?? banc.status;
  const statusBg = statusColor[banc.status] ?? colors.muted;

  const complexity = banc.complexity;
  const access = banc.security.accesscontrol; // boolean | null
  let remote: boolean | null = null;
  if (banc.technicalCapabilities.includes("remote-access")) remote = true;
  else if (banc.technicalCapabilities.includes("no-remote-access")) remote = false;

  const subLocality = [banc.location.building, banc.location.room]
    .filter((s): s is string => !!s && s.length > 0)
    .join(" · ");

  return (
    <Page size="A4" style={styles.page} id={`bench-${banc.externalId}`}>
      {/* Zone 1 — Header */}
      <View style={styles.section}>
        <Text style={styles.h1}>{banc.name}</Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginTop: 6,
            gap: 8,
          }}
        >
          {/* Left: externalId + status badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ ...styles.mono, color: colors.muted }}>
              [{banc.externalId}]
            </Text>
            <Text style={{ ...styles.badge, backgroundColor: statusBg }}>
              {status}
            </Text>
          </View>

          {/* Right: complexity / access / remote */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <IconLabel
              icon={complexity ? <PdfComplexityIcon level={complexity} size={16} /> : null}
              label={complexity ? COMPLEXITY_LABELS[complexity] ?? complexity : "—"}
            />
            <IconLabel
              icon={access === null ? null : <PdfAccessIcon enabled={access} size={16} />}
              label={triStateLabel(access, "Access secured", "Access not secured", "Access: —")}
            />
            <IconLabel
              icon={remote === null ? null : <PdfRemoteIcon enabled={remote} size={16} />}
              label={triStateLabel(remote, "Remote access", "No remote access", "Remote access: —")}
            />
          </View>
        </View>
      </View>

      {/* Zone 2 — Photo (centered) */}
      <View
        style={{
          alignSelf: "center",
          width: "70%",
          height: 170,
          marginBottom: 14,
          backgroundColor: colors.surface,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {banc.resolvedCover ? (
          <Image
            src={banc.resolvedCover}
            style={{ maxHeight: 170, maxWidth: "100%", objectFit: "contain" }}
          />
        ) : (
          <Text style={styles.small}>No photo available</Text>
        )}
      </View>

      {/* Zone 3 — Three-column band */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
        {/* Left column */}
        <View style={{ flex: 1 }}>
          <Section title="Identity">
            <View style={styles.chipType}>
              <PdfTypeIcon type={banc.type} size={14} />
              <Text style={styles.chipTypeLabel}>
                {TYPE_LABELS[banc.type] ?? banc.type}
              </Text>
            </View>
          </Section>

          <Section title="Aircraft Programs">
            {banc.programs.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {banc.programs.map((p, i) => (
                  <View key={`${p}-${i}`} style={styles.tile}>
                    <PdfAircraftIcon size={22} />
                    <Text style={styles.tileLabel}>{p}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.body}>—</Text>
            )}
          </Section>

          <Section title="ATA Chapters">
            {banc.atas.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {banc.atas.map((a, i) => (
                  <View key={`${a}-${i}`} style={styles.tile}>
                    <PdfAtaIcon size={22} />
                    <Text style={styles.tileLabel}>ATA {a}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.body}>—</Text>
            )}
          </Section>
        </View>

        {/* Center column — location */}
        <View style={{ flex: 1.1, alignItems: "center" }}>
          <PdfCountryMap
            country={banc.location.country}
            site={banc.location.site}
            width={110}
          />
          <Text
            style={{ ...styles.h2, marginTop: 6, textAlign: "center" }}
          >
            {banc.location.city || "—"}
          </Text>
          {subLocality.length > 0 && (
            <Text style={{ ...styles.small, textAlign: "center", marginTop: 2 }}>
              {subLocality}
            </Text>
          )}
        </View>

        {/* Right column — vertical lifecycle timeline */}
        <View style={{ flex: 1 }}>
          {LIFECYCLE_STEPS.map((step) => {
            const raw = banc.lifecycle[step.key];
            const reached = !!raw;
            const c = reached ? lifecycleColor[step.key] : colors.muted;
            return (
              <View
                key={step.key}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: reached ? c : "transparent",
                      borderWidth: reached ? 0 : 1,
                      borderColor: colors.muted,
                    }}
                  />
                  <step.Icon size={14} color={c} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...styles.body,
                      fontFamily: "Helvetica-Bold",
                      color: reached ? colors.fg : colors.muted,
                    }}
                  >
                    {step.label}
                  </Text>
                  <Text style={styles.small}>
                    {reached ? step.reached(formatDate(raw)) : step.unreached}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Zone 4 — Full-width sections */}
      {/* Manager — no chapter title: the role is already shown under the name */}
      {banc.manager && (
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                ...styles.avatar,
                backgroundColor: avatarColor(
                  banc.manager.email ?? banc.manager.name,
                ),
              }}
            >
              <Text
                style={{
                  color: colors.bg,
                  fontSize: 13,
                  fontFamily: "Helvetica-Bold",
                }}
              >
                {initials(banc.manager.name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...styles.body, fontFamily: "Helvetica-Bold" }}>
                {banc.manager.name}
              </Text>
              <Text style={styles.small}>Lab Test Mean Manager</Text>
              {banc.manager.email && (
                <Text style={{ ...styles.mono, color: colors.muted }}>
                  {banc.manager.email}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      <Section title="Description">
        <Text style={styles.body}>{banc.description || "—"}</Text>
      </Section>

      <Section title="Instrumentation">
        <Text style={styles.body}>{banc.instrumentation || "—"}</Text>
      </Section>

      <Section title="Software">
        {banc.softwares.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {banc.softwares.map((s) => (
              <Text key={s.id} style={styles.chip}>
                {s.name}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.body}>—</Text>
        )}
      </Section>

      {/* Footer link */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 40,
          right: 40,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingTop: 8,
        }}
        fixed
      >
        <Link
          src={`${baseUrl}${labTestMeanHref(banc.externalId)}`}
          style={{ ...styles.small, color: colors.accent }}
        >
          <Text>View on dashboard ↗</Text>
        </Link>
      </View>
    </Page>
  );
}

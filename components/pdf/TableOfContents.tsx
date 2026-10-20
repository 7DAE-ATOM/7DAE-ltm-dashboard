import { Page, Text, View, Link } from "@react-pdf/renderer";
import type { LabTestMean } from "@/lib/types";
import { labTestMeanHref } from "@/lib/labTestMeanHref";
import { styles, colors } from "./styles";

type Props = {
  benches: LabTestMean[];
  baseUrl: string;
};

export default function TableOfContents({ benches, baseUrl }: Readonly<Props>) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>Contents</Text>
      <Text style={{ ...styles.small, marginTop: 4 }}>
        Click a row to jump to its detail page. Click ↗ to open in the
        dashboard.
      </Text>
      <View style={styles.divider} />

      <View>
        {benches.map((b, i) => (
          <View
            key={b.externalId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 5,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
            }}
            wrap={false}
          >
            <Text
              style={{ ...styles.small, width: 28, color: colors.muted }}
            >
              {i + 1}.
            </Text>
            <View style={{ flex: 1 }}>
              <Link src={`#bench-${b.externalId}`} style={styles.link}>
                <Text style={{ ...styles.body, color: colors.accent }}>
                  {b.name}
                </Text>
              </Link>
            </View>
            <Text
              style={{
                ...styles.mono,
                width: 130,
                color: colors.muted,
              }}
            >
              {b.externalId}
            </Text>
            <Link
              src={`${baseUrl}${labTestMeanHref(b.externalId)}`}
              style={{ width: 18, textAlign: "right" }}
            >
              <Text style={{ ...styles.small, color: colors.accent }}>↗</Text>
            </Link>
          </View>
        ))}
      </View>
    </Page>
  );
}

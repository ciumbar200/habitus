import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { es, type CompatibilityResult } from "@habitus/core";

type Props = {
  score: number | null | undefined;
  result?: CompatibilityResult;
  label?: string;
  defaultOpen?: boolean;
};

export function CompatibilityScore({ score, result, label, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const canExpand = Boolean(result?.dimensions?.length);
  const display = score != null ? `${score}%` : "—";

  return (
    <View>
      <Pressable
        onPress={() => canExpand && setOpen(true)}
        disabled={!canExpand}
        style={[styles.pill, !canExpand && styles.pillDisabled]}
        accessibilityRole="button"
        accessibilityLabel={canExpand ? es.compat.tapForBreakdown : undefined}
      >
        <Text style={styles.pillText}>
          {display}
          {label ? ` ${label}` : ""}
          {canExpand ? " ▾" : ""}
        </Text>
      </Pressable>

      {defaultOpen && result && <BreakdownBody result={result} />}
      {score != null && !canExpand && (
        <Text style={styles.hint}>{es.compat.quizRequiredInquilino}</Text>
      )}

      <Modal visible={open && !defaultOpen} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{es.compat.breakdownTitle}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Text style={styles.close}>{es.common.close}</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.sheetScroll}>
              {result && <BreakdownBody result={result} />}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function BreakdownBody({ result }: { result: CompatibilityResult }) {
  return (
    <View style={styles.body}>
      {result.summary ? <Text style={styles.summary}>{result.summary}</Text> : null}
      {result.dimensions.map((d) => (
        <View key={d.key} style={styles.row}>
          <View style={styles.rowHead}>
            <Text style={styles.dimLabel}>{d.label}</Text>
            <Text style={styles.dimScore}>{d.score}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, d.score))}%` }]} />
          </View>
          <Text style={styles.detail}>{d.detail}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
  },
  pillDisabled: { opacity: 0.85 },
  pillText: { color: "#2d6a4f", fontWeight: "700", fontSize: 12 },
  hint: { fontSize: 10, color: "#666", marginTop: 4, lineHeight: 14 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    maxHeight: "78%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e4dc",
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#1a3d2e" },
  close: { color: "#2d6a4f", fontWeight: "600" },
  sheetScroll: { paddingHorizontal: 16 },
  body: { paddingVertical: 8 },
  summary: { color: "#666", marginBottom: 12, lineHeight: 20 },
  row: { marginBottom: 14 },
  rowHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  dimLabel: { fontWeight: "600", color: "#1a3d2e", flex: 1 },
  dimScore: { fontWeight: "700", color: "#2d6a4f" },
  track: {
    height: 6,
    backgroundColor: "#e8e4dc",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#2d6a4f", borderRadius: 3 },
  detail: { fontSize: 11, color: "#666", marginTop: 4, lineHeight: 16 },
});

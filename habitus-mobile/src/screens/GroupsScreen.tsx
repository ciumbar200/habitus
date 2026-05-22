import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { es, fetchMyGroups, type LivingGroup } from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<MainStackParamList, "Groups">;

export function GroupsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LivingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyGroups(user.id)
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, user?.id]);

  return (
    <View style={styles.root}>
      <Text style={styles.sub}>{es.groups.subtitle}</Text>
      <Pressable style={styles.createBtn} onPress={() => navigation.navigate("CreateGroup")}>
        <Text style={styles.createBtnText}>{es.groups.create}</Text>
      </Pressable>
      {loading && <ActivityIndicator style={{ marginTop: 24 }} color="#1a3d2e" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && groups.length === 0 && (
        <Text style={styles.empty}>{es.groups.empty}</Text>
      )}
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("GroupDetail", { slug: item.slug })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.city} · {item.memberCount}/{item.targetMembers} {es.groups.member}
            </Text>
            <Text style={styles.status}>{item.status}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  sub: { padding: 16, color: "#666", fontSize: 15 },
  createBtn: {
    marginHorizontal: 16,
    backgroundColor: "#1a3d2e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  name: { fontSize: 17, fontWeight: "600", color: "#1a3d2e" },
  meta: { color: "#666", marginTop: 4 },
  status: { marginTop: 8, fontSize: 12, color: "#2d6a4f", textTransform: "capitalize" },
  error: { color: "#b91c1c", padding: 16 },
  empty: { textAlign: "center", color: "#666", marginTop: 32, paddingHorizontal: 16 },
});

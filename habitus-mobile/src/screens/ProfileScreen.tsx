import { StyleSheet, Text, View, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { accountRoleLabel, es } from "@habitus/core";
import type { ProfileStackParamList } from "../navigation/ProfileStack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

export function ProfileScreen({ navigation }: Props) {
  const { profile, user, signOut } = useAuth();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{es.profile.portal}</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{profile?.displayName ?? user?.email ?? "—"}</Text>
        {profile?.accountRole && (
          <Text style={styles.meta}>{accountRoleLabel(profile.accountRole)}</Text>
        )}
        {profile?.roleTitle ? <Text style={styles.meta}>{profile.roleTitle}</Text> : null}
        <Text style={styles.score}>
          {es.profile.profileScore}: {profile?.profileScore ?? 0}%
        </Text>
      </View>
      <Pressable
        style={styles.linkBtn}
        onPress={() => navigation.navigate("ProfileEdit")}
      >
        <Text style={styles.linkText}>{es.profile.editProfile}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => signOut()}>
        <Text style={styles.btnText}>{es.common.signOut}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a3d2e", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  name: { fontSize: 20, fontWeight: "600" },
  meta: { color: "#666", marginTop: 6 },
  score: { color: "#2d6a4f", marginTop: 12, fontWeight: "600" },
  linkBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1a3d2e",
    alignItems: "center",
  },
  linkText: { color: "#1a3d2e", fontWeight: "600" },
  btn: {
    marginTop: 12,
    backgroundColor: "#1a3d2e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});

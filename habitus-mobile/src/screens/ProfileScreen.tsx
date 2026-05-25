import { StyleSheet, Text, View, Pressable, Image, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { accountRoleLabel, es, secondaryNavItemsForRole } from "@habitus/core";
import type { ProfileStackParamList } from "../navigation/ProfileStack";
import { navigateFromTabs } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";
import { MOON_LOGO_BLACK } from "../theme/brandAssets";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

export function ProfileScreen({ navigation }: Props) {
  const { profile, user, signOut } = useAuth();
  const secondary = secondaryNavItemsForRole(profile?.accountRole);

  const getRoleIcon = (role?: string | null) => {
    switch (role) {
      case "inquilino":
        return "person-outline";
      case "anfitrion":
        return "home-outline";
      case "propietario":
        return "apartment";
      case "agencia":
        return "business";
      case "admin":
        return "admin-panel-settings";
      default:
        return "person-outline";
    }
  };

  return (
    <View style={styles.root}>
      {/* Header with gradient background */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={liquidGlassTheme.colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={MOON_LOGO_BLACK}
              style={styles.logo}
              resizeMode="contain"
              tintColor={liquidGlassTheme.colors.white}
            />
          </View>

          {/* Profile info card */}
          <View style={styles.profileCard}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject}>
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            </BlurView>
            <View style={styles.profileCardContent}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <MaterialIcons
                    name={getRoleIcon(profile?.accountRole) as any}
                    size={32}
                    color={liquidGlassTheme.colors.white}
                  />
                </View>
              </View>
              <Text style={styles.name}>
                {profile?.displayName ?? user?.email ?? "—"}
              </Text>
              {profile?.accountRole && (
                <View style={styles.roleBadge}>
                  <MaterialIcons
                    name={getRoleIcon(profile.accountRole) as any}
                    size={14}
                    color={liquidGlassTheme.colors.white}
                  />
                  <Text style={styles.roleText}>
                    {accountRoleLabel(profile.accountRole)}
                  </Text>
                </View>
              )}
              {profile?.roleTitle ? (
                <Text style={styles.meta}>{profile.roleTitle}</Text>
              ) : null}
              <View style={styles.scoreContainer}>
                <MaterialIcons
                  name="stars"
                  size={16}
                  color={liquidGlassTheme.colors.brand.accent}
                />
                <Text style={styles.score}>
                  {es.profile.profileScore}: {profile?.profileScore ?? 0}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menuContainer}>
        {secondary.map((item, index) => (
          <Pressable
            key={item.path}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={() => {
              if (item.path === "/grupos") navigateFromTabs(navigation, "Groups");
            }}
          >
            <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.menuItemContent}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={liquidGlassTheme.colors.brand.primary}
                />
              </View>
              <Text style={styles.menuItemText}>{item.label}</Text>
            </View>
          </Pressable>
        ))}

        {profile?.isAdmin && (
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={() => navigateFromTabs(navigation, "AdminDashboard")}
          >
            <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.menuItemContent}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons
                  name="shield"
                  size={20}
                  color={liquidGlassTheme.colors.brand.error}
                />
              </View>
              <Text style={[styles.menuItemText, styles.adminItemText]}>
                {es.admin.nav.short}
              </Text>
            </View>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate("ProfileEdit")}
        >
          <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.menuItemContent}>
            <View style={styles.menuIconContainer}>
              <MaterialIcons
                name="edit"
                size={20}
                color={liquidGlassTheme.colors.brand.secondary}
              />
            </View>
            <Text style={styles.menuItemText}>{es.profile.editProfile}</Text>
          </View>
        </Pressable>

        {/* Sign out button */}
        <Pressable
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && styles.signOutBtnPressed,
          ]}
          onPress={() => signOut()}
        >
          <LinearGradient
            colors={[liquidGlassTheme.colors.brand.error, "#dc2626"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.signOutContent}>
            <MaterialIcons
              name="logout"
              size={20}
              color={liquidGlassTheme.colors.white}
            />
            <Text style={styles.signOutText}>{es.common.signOut}</Text>
          </View>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={MOON_LOGO_BLACK}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.footerText}>: moon shared living</Text>
        <Text style={styles.footerVersion}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  headerContainer: {
    paddingTop: liquidGlassTheme.spacing.xl + 8,
    paddingBottom: liquidGlassTheme.spacing.xxxl,
    borderBottomLeftRadius: liquidGlassTheme.borderRadius.xxxl,
    borderBottomRightRadius: liquidGlassTheme.borderRadius.xxxl,
    overflow: "hidden",
  },
  headerContent: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  logo: {
    width: 120,
    height: 40,
  },
  profileCard: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.xl,
  },
  profileCardContent: {
    padding: liquidGlassTheme.spacing.xl,
    alignItems: "center",
  },
  avatarContainer: {
    marginTop: liquidGlassTheme.spacing.xxxl,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: liquidGlassTheme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: liquidGlassTheme.colors.white,
  },
  name: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "30",
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.xs,
    borderRadius: liquidGlassTheme.borderRadius.xl,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  roleText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.white,
  },
  meta: {
    color: liquidGlassTheme.colors.light.text.secondary,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    marginTop: liquidGlassTheme.spacing.sm,
  },
  score: {
    color: liquidGlassTheme.colors.light.text.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
  },
  menuContainer: {
    padding: liquidGlassTheme.spacing.lg,
    gap: liquidGlassTheme.spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    borderRadius: liquidGlassTheme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.sm,
  },
  menuItemPressed: {
    transform: [{ scale: 0.98 }],
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: liquidGlassTheme.spacing.md,
    flex: 1,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    marginRight: liquidGlassTheme.spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  adminItemText: {
    color: liquidGlassTheme.colors.brand.error,
  },
  signOutBtn: {
    flexDirection: "row",
    borderRadius: liquidGlassTheme.borderRadius.lg,
    overflow: "hidden",
    marginTop: liquidGlassTheme.spacing.md,
    height: 52,
    ...liquidGlassTheme.shadows.md,
  },
  signOutBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  signOutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: liquidGlassTheme.spacing.sm,
  },
  signOutText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.white,
  },
  footer: {
    alignItems: "center",
    padding: liquidGlassTheme.spacing.xl,
    marginTop: "auto",
  },
  footerLogo: {
    width: 80,
    height: 28,
    marginBottom: liquidGlassTheme.spacing.sm,
    opacity: 0.6,
  },
  footerText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
    marginBottom: 2,
  },
  footerVersion: {
    fontSize: liquidGlassTheme.typography.fontSize.caption2,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
});

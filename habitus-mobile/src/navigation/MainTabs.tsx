import type { ComponentType } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { mobileTabsForRole } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { ReturnToPropertyHandler } from "../components/ReturnToPropertyHandler";
import { DiscoverStack } from "./DiscoverStack";
import { MatchesScreen } from "../screens/MatchesScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { PanelStack } from "./PanelStack";
import { SpacesStack } from "./SpacesStack";
import { ProfileStack } from "./ProfileStack";
import { CommunityScreen } from "../screens/CommunityScreen";
import { GroupsScreen } from "../screens/GroupsScreen";
import { ApplicationsScreen } from "../screens/panel/ApplicationsScreen";
import { liquidGlassTheme } from "../theme/liquidGlass";

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Community: undefined;
  Groups: undefined;
  Messages: { conversationId?: string } | undefined;
  Profile: undefined;
  Panel: undefined;
  Spaces: undefined;
  Applications: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const screens: Record<string, ComponentType<any>> = {
  Discover: DiscoverStack,
  Matches: MatchesScreen,
  Community: CommunityScreen,
  Groups: GroupsScreen,
  Messages: MessagesScreen,
  Profile: ProfileStack,
  Panel: PanelStack,
  Spaces: SpacesStack,
  Applications: ApplicationsScreen,
};

export function MainTabs() {
  const { profile } = useAuth();
  const tabs = mobileTabsForRole(profile?.accountRole);

  return (
    <>
      <ReturnToPropertyHandler />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: liquidGlassTheme.colors.brand.primary,
          tabBarInactiveTintColor: liquidGlassTheme.colors.light.text.tertiary,
          tabBarStyle: {
            backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
            borderTopColor: liquidGlassTheme.colors.light.border.subtle,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 5,
            paddingTop: 5,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            letterSpacing: -0.2,
          },
          tabBarItemStyle: {
            paddingVertical: 5,
          },
        }}
      >
        {tabs.map((tab) => {
          const Screen = screens[tab.screen];
          if (!Screen) return null;
          return (
            <Tab.Screen
              key={tab.screen}
              name={tab.screen as keyof MainTabParamList}
              component={Screen}
              options={{ title: tab.label }}
            />
          );
        })}
      </Tab.Navigator>
    </>
  );
}

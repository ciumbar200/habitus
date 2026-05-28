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
import { MaterialIcons } from "@expo/vector-icons";

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

  // Icon mapping for tabs
  const getIcon = (screen: string, focused: boolean) => {
    const icons: Record<string, string> = {
      Discover: focused ? "explore" : "explore-off",
      Matches: focused ? "favorite" : "favorite-border",
      Community: focused ? "people" : "people-outline",
      Groups: focused ? "group" : "group-outlined",
      Messages: focused ? "chat-bubble" : "chat-bubble-outline",
      Profile: focused ? "person" : "person-outline",
      Panel: focused ? "dashboard" : "dashboard-outlined",
      Spaces: focused ? "home" : "home-outlined",
      Applications: focused ? "assignment" : "assignment-outlined",
    };
    return icons[screen] || "circle";
  };

  return (
    <>
      <ReturnToPropertyHandler />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: liquidGlassTheme.colors.brand.primary,
          tabBarInactiveTintColor: liquidGlassTheme.colors.light.text.tertiary,
          tabBarStyle: {
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            borderTopColor: "rgba(0, 0, 0, 0.06)",
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
              options={{
                title: tab.label,
                tabBarIcon: ({ focused }) => (
                  <MaterialIcons
                    name={getIcon(tab.screen, focused) as any}
                    size={24}
                    color={focused ? liquidGlassTheme.colors.brand.primary : liquidGlassTheme.colors.light.text.tertiary}
                  />
                ),
              }}
            />
          );
        })}
      </Tab.Navigator>
    </>
  );
}

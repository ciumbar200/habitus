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
import { ApplicationsScreen } from "../screens/panel/ApplicationsScreen";

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Community: undefined;
  Messages: { conversationId?: string } | undefined;
  Profile: undefined;
  Panel: undefined;
  Spaces: undefined;
  Applications: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const screens: Record<string, ComponentType> = {
  Discover: DiscoverStack,
  Matches: MatchesScreen,
  Community: CommunityScreen,
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
          tabBarActiveTintColor: "#1a3d2e",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#e8e4dc" },
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

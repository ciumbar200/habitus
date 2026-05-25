import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { es } from "@habitus/core";
import { MainTabs } from "./MainTabs";
import { GroupsScreen } from "../screens/GroupsScreen";
import { CreateGroupScreen } from "../screens/CreateGroupScreen";
import { GroupDetailScreen } from "../screens/GroupDetailScreen";
import { GroupExpensesScreen } from "../screens/GroupExpensesScreen";
import { MemberPublicScreen } from "../screens/MemberPublicScreen";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";

export type MainStackParamList = {
  MainTabs: undefined;
  MemberPublic: { slug: string };
  Groups: undefined;
  CreateGroup: undefined;
  GroupDetail: { slug: string };
  GroupExpenses: { groupId: string; groupName: string; slug: string };
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: "#1a3d2e" }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="MemberPublic"
        component={MemberPublicScreen}
        options={{ title: "Perfil" }}
      />
      <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: es.groups.title }} />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: es.groups.createTitle }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: es.groups.title }}
      />
      <Stack.Screen
        name="GroupExpenses"
        component={GroupExpensesScreen}
        options={{ title: es.expenses.title }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: es.admin.title }}
      />
    </Stack.Navigator>
  );
}

/** Navega desde tabs anidados (p. ej. Perfil → Grupos). */
export function navigateFromTabs(
  navigation: { getParent: () => unknown },
  screen: keyof MainStackParamList,
  params?: MainStackParamList[keyof MainStackParamList],
) {
  const tabNav = navigation.getParent() as { getParent: () => { navigate: (a: string, b?: unknown) => void } } | null;
  const mainNav = tabNav?.getParent();
  mainNav?.navigate(screen, params);
}

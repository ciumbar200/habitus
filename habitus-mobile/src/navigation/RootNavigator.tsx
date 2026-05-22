import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { profileNeedsOnboarding } from "@habitus/core";
import { CompatibilityQuizScreen } from "../screens/CompatibilityQuizScreen";
import { useAuth } from "../context/AuthContext";
import { CompleteRoleScreen } from "../screens/CompleteRoleScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PropertyDetailScreen } from "../screens/PropertyDetailScreen";
import { MainTabs } from "./MainTabs";

export type RootStackParamList = {
  Login: { signup?: boolean } | undefined;
  PropertyGuest: { slug: string };
  CompleteRole: undefined;
  Onboarding: undefined;
  Quiz: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, profile, loading, quizComplete } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a3d2e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="PropertyGuest"
              component={PropertyDetailScreen}
              options={{ headerShown: true, title: "", headerTintColor: "#1a3d2e" }}
            />
          </>
        ) : !profile?.accountRole ? (
          <Stack.Screen name="CompleteRole" component={CompleteRoleScreen} />
        ) : profileNeedsOnboarding(profile) ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onDone={() => undefined} />}
          </Stack.Screen>
        ) : !quizComplete ? (
          <Stack.Screen name="Quiz" component={CompatibilityQuizScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

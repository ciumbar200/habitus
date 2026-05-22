import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { es } from "@habitus/core";
import { CompatibilityQuizScreen } from "../screens/CompatibilityQuizScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProfileEditScreen } from "../screens/ProfileEditScreen";

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  ProfileQuiz: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTintColor: "#1a3d2e" }}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: es.editProfile.title }}
      />
      <Stack.Screen
        name="ProfileQuiz"
        component={CompatibilityQuizScreen}
        options={{ title: es.editProfile.editQuiz }}
      />
    </Stack.Navigator>
  );
}

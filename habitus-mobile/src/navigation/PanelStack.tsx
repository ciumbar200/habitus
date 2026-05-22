import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PanelHomeScreen } from "../screens/panel/PanelHomeScreen";

export type PanelStackParamList = {
  PanelHome: undefined;
};

const Stack = createNativeStackNavigator<PanelStackParamList>();

export function PanelStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTintColor: "#1a3d2e" }}>
      <Stack.Screen name="PanelHome" component={PanelHomeScreen} options={{ title: "Panel" }} />
    </Stack.Navigator>
  );
}

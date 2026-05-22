import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DiscoverScreen } from "../screens/DiscoverScreen";
import { PropertyDetailScreen } from "../screens/PropertyDetailScreen";

export type DiscoverStackParamList = {
  DiscoverList: undefined;
  PropertyDetail: { slug: string };
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export function DiscoverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DiscoverList"
        component={DiscoverScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ title: "", headerTintColor: "#1a3d2e" }}
      />
    </Stack.Navigator>
  );
}

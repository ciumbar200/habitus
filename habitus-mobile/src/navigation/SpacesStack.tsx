import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { HostSpacesScreen } from "../screens/panel/HostSpacesScreen";
import { MyListingsScreen } from "../screens/panel/MyListingsScreen";
import { ListingEditorScreen } from "../screens/panel/ListingEditorScreen";

export type SpacesStackParamList = {
  SpacesHome: undefined;
  ListingEditor: { listingId?: string };
};

const Stack = createNativeStackNavigator<SpacesStackParamList>();

export function SpacesStack() {
  const { profile } = useAuth();
  const isHost = profile?.accountRole === "anfitrion";
  const canEdit =
    profile?.accountRole === "anfitrion" ||
    profile?.accountRole === "propietario" ||
    profile?.accountRole === "agencia";

  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTintColor: "#1a3d2e" }}>
      <Stack.Screen
        name="SpacesHome"
        component={isHost ? HostSpacesScreen : MyListingsScreen}
        options={{
          title: isHost
            ? "Espacios"
            : profile?.accountRole === "agencia"
              ? "Cartera"
              : "Espacios",
        }}
      />
      {canEdit ? (
        <Stack.Screen
          name="ListingEditor"
          component={ListingEditorScreen}
          options={{ title: "Espacio" }}
        />
      ) : null}
    </Stack.Navigator>
  );
}

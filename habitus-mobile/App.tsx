import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./src/lib/supabase";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme/colors";
import { ThemeProvider } from "./src/components/glass";

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    InstrumentSerif_400Regular,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) setReady(true);
  }, [fontsLoaded]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.deepNavy} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

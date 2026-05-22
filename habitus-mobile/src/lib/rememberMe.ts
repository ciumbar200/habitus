import AsyncStorage from "@react-native-async-storage/async-storage";

const REMEMBER_KEY = "habitus_remember_me";
const EMAIL_KEY = "habitus_remember_email";

export async function loadRememberedEmail(): Promise<string> {
  if ((await AsyncStorage.getItem(REMEMBER_KEY)) !== "1") return "";
  return (await AsyncStorage.getItem(EMAIL_KEY)) ?? "";
}

export async function saveRememberMe(email: string, remember: boolean): Promise<void> {
  if (remember) {
    await AsyncStorage.multiSet([
      [REMEMBER_KEY, "1"],
      [EMAIL_KEY, email.trim()],
    ]);
  } else {
    await AsyncStorage.multiRemove([REMEMBER_KEY, EMAIL_KEY]);
  }
}

const REMEMBER_KEY = "habitus_remember_me";
const EMAIL_KEY = "habitus_remember_email";

export function loadRememberedEmail(): string {
  if (typeof localStorage === "undefined") return "";
  if (localStorage.getItem(REMEMBER_KEY) !== "1") return "";
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function saveRememberMe(email: string, remember: boolean): void {
  if (typeof localStorage === "undefined") return;
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, "1");
    localStorage.setItem(EMAIL_KEY, email.trim());
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(EMAIL_KEY);
  }
}

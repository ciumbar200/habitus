type AuthModeTabsProps = {
  mode: "signin" | "signup";
  onChange: (mode: "signin" | "signup") => void;
  signInLabel: string;
  signUpLabel: string;
};

export function AuthModeTabs({ mode, onChange, signInLabel, signUpLabel }: AuthModeTabsProps) {
  return (
    <div
      className="auth-mode-tabs mb-8 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1"
      role="tablist"
      aria-label="Modo de acceso"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "signin"}
        data-testid="toggle-auth-mode-signin"
        onClick={() => onChange("signin")}
        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
          mode === "signin"
            ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/80"
            : "text-stone-500 hover:text-stone-800"
        }`}
      >
        {signInLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "signup"}
        data-testid="toggle-auth-mode"
        onClick={() => onChange("signup")}
        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
          mode === "signup"
            ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/80"
            : "text-stone-500 hover:text-stone-800"
        }`}
      >
        {signUpLabel}
      </button>
    </div>
  );
}

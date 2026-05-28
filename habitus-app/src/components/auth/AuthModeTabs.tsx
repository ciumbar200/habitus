type AuthModeTabsProps = {
  mode: "signin" | "signup";
  onChange: (mode: "signin" | "signup") => void;
  signInLabel: string;
  signUpLabel: string;
};

export function AuthModeTabs({ mode, onChange, signInLabel, signUpLabel }: AuthModeTabsProps) {
  return (
    <div
      className="auth-mode-tabs mb-8 flex gap-2 rounded-xl bg-stone-100 p-1.5"
      role="tablist"
      aria-label="Modo de acceso"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "signin"}
        data-testid="toggle-auth-mode-signin"
        onClick={() => onChange("signin")}
        className={`flex min-h-[48px] flex-1 items-center justify-center rounded-lg px-3 py-3 text-center text-[15px] font-semibold leading-snug transition-all sm:min-h-[44px] sm:px-4 sm:py-2.5 sm:text-sm ${
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
        className={`flex min-h-[48px] flex-1 items-center justify-center rounded-lg px-3 py-3 text-center text-[15px] font-semibold leading-snug transition-all sm:min-h-[44px] sm:px-4 sm:py-2.5 sm:text-sm ${
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

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; inline?: boolean };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(": moon render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.inline) {
        return (
          <div className="rounded-xl border border-border-light bg-surface-container-lowest p-4 text-left">
            <p className="text-label-md text-deep-navy">No se pudo cargar esta sección.</p>
            <p className="mt-1 text-label-sm text-warm-slate">{this.state.error.message}</p>
          </div>
        );
      }
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <h1 className="text-headline-md text-deep-navy">Algo salió mal</h1>
          <p className="max-w-md text-body-md text-warm-slate">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            className="rounded-lg bg-deep-navy px-5 py-3 text-label-md text-white"
          >
            Volver al inicio
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

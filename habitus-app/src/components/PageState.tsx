type PageStateProps = {
  message?: string;
};

export function LoadingState({ message = "Cargando…" }: PageStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-margin-mobile">
      <p className="text-body-md text-warm-slate">{message}</p>
    </div>
  );
}

export function ErrorState({ message = "No se pudieron cargar los datos." }: PageStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-margin-mobile">
      <p className="text-body-md text-error">{message}</p>
    </div>
  );
}

import type { ElementType, ReactNode } from "react";
import { useInView } from "../../lib/useInView";

type RevealProps = {
  children: ReactNode;
  /** Retardo en ms para escalonar entradas. */
  delay?: number;
  /** Dirección de la entrada. */
  from?: "up" | "down" | "left" | "right" | "scale" | "none";
  /** Etiqueta HTML a renderizar. */
  as?: ElementType;
  className?: string;
};

const HIDDEN: Record<NonNullable<RevealProps["from"]>, string> = {
  up: "translate-y-8",
  down: "-translate-y-8",
  left: "translate-x-8",
  right: "-translate-x-8",
  scale: "scale-95",
  none: "",
};

/**
 * Envoltorio de aparición al hacer scroll. Suave, con easing pro y
 * soporte de prefers-reduced-motion (vía useInView, que marca visible al instante).
 */
export function Reveal({
  children,
  delay = 0,
  from = "up",
  as,
  className = "",
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={[
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] motion-reduce:transition-none",
        inView ? "opacity-100 translate-x-0 translate-y-0 scale-100" : `opacity-0 ${HIDDEN[from]}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

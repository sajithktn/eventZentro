import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { LoaderCircle } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-gradient-to-r from-[#ffb703] via-[#ff3d57] to-[#8b5cf6] text-white shadow-[0_12px_35px_rgba(255,61,87,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(255,61,87,0.4)]",

  secondary:
    "border-white/10 bg-white/10 text-white hover:border-white/20 hover:bg-white/15",

  outline:
    "border-white/15 bg-transparent text-zinc-200 hover:border-[#ff3d57]/50 hover:bg-[#ff3d57]/10 hover:text-white",

  ghost:
    "border-transparent bg-transparent text-zinc-300 hover:bg-white/[0.07] hover:text-white",

  danger:
    "border-red-500/20 bg-red-500/10 text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-lg px-4 py-2 text-sm",
  md: "min-h-11 rounded-xl px-5 py-2.5 text-sm",
  lg: "min-h-13 rounded-xl px-7 py-3.5 text-base",
  icon: "h-11 w-11 rounded-xl p-0",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={[
          "hover-shine inline-flex items-center justify-center gap-2 border font-bold",
          "transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[#ff3d57]/60 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[#070709]",
          "disabled:pointer-events-none disabled:cursor-not-allowed",
          "disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {isLoading && (
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />
        )}

        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      id,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        )}

        <div className="group relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-orange-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={`h-12 w-full rounded-xl border bg-white/[0.04] px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-zinc-600 hover:border-white/20 focus:border-orange-400/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-orange-500/10 ${
              leftIcon ? "pl-11" : ""
            } ${rightIcon ? "pr-12" : ""} ${
              error
                ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/10"
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input; 
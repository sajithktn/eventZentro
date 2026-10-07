interface LoaderProps {
  fullScreen?: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "h-5 w-5 border-2",
  md: "h-9 w-9 border-[3px]",
  lg: "h-14 w-14 border-4",
};

export default function Loader({
  fullScreen = false,
  text,
  size = "md",
}: LoaderProps) {
  const loader = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeStyles[size]} animate-spin rounded-full border-white/15 border-t-[#ff3d57] border-r-[#ffb703]`}
      />

      {text && (
        <p className="text-sm font-medium text-zinc-400">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070709]">
        {loader}
      </div>
    );
  }

  return loader;
}
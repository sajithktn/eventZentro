import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

function VerifyEmailLoading() {
  return (
    <div className="flex items-center gap-3 text-sm text-white/60">
      <Loader2 className="animate-spin text-orange-400" size={22} />
      Loading verification page...
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080d] px-4 py-12">
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[420px] w-[420px] rounded-full bg-orange-500/15 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[140px]" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:55px_55px]" />

      <div className="relative z-10 flex w-full justify-center">
        <Suspense fallback={<VerifyEmailLoading />}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </main>
  );
}
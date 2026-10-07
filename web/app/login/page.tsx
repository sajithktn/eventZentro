import GuestOnlyRoute from "@/features/auth/components/GuestOnlyRoute";
import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <GuestOnlyRoute>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
        <LoginForm />
      </main>
    </GuestOnlyRoute>
  );
}

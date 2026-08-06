import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <GuestOnlyRoute>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
        <LoginForm />
      </main>
    </GuestOnlyRoute>
  );
}

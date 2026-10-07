import GuestOnlyRoute from "@/features/auth/components/GuestOnlyRoute";
import RegisterForm from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <GuestOnlyRoute>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
        <RegisterForm />
      </main>
    </GuestOnlyRoute>
  );
}

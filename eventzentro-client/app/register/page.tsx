import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <GuestOnlyRoute>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
        <RegisterForm />
      </main>
    </GuestOnlyRoute>
  );
}

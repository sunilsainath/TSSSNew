import type { Metadata } from "next";

import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function AdminForgotPasswordPage() {
  return (
    <AdminAuthCard
      title="Forgot your password?"
      subtitle="Enter the email address for your account and we will send you a link to choose a new password."
    >
      <ForgotPasswordForm />
    </AdminAuthCard>
  );
}
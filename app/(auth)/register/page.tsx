import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/register-form";

const VALID_PLANS = ["starter", "pro", "enterprise"];

interface RegisterPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const plan = params.plan;

  if (!plan || !VALID_PLANS.includes(plan)) {
    redirect("/#pricing");
  }

  return <RegisterForm initialPlan={plan} />;
}

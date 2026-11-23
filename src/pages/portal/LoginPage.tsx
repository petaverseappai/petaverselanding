import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "@/types/auth.types";
import { providerLogin } from "@/services/admin";
import { getMyPage } from "@/services/portal";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { usePortalPage } from "@/context/PortalPageContext";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PortalLoginPage() {
  const { login } = usePortalAuth();
  const { setPage } = usePortalPage();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await providerLogin(values.email, values.password);

      if (!data.roles.includes("ServiceProvider")) {
        toast.error("Access denied.");
        return;
      }

      login(data.accessToken);

      try {
        const page = await getMyPage();
        setPage(page);
        navigate(ROUTES.PORTAL_DASHBOARD, { replace: true });
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          navigate(ROUTES.PORTAL_NO_PAGE, { replace: true });
        } else {
          throw err;
        }
      }
    } catch {
      toast.error("Invalid credentials.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">PetaVerse Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your service provider account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">Enter a valid email.</p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">Password is required.</p>
            )}
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

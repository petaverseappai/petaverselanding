import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "@/types/auth.types";
import { portalLogin } from "@/services/admin";
import { getMyPage } from "@/services/portal";
import { useAuth } from "@/context/AuthContext";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { usePortalPage } from "@/context/PortalPageContext";
import { errMessage } from "@/lib/adminFormat";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_ADMIN = "Admin";
const ROLE_SERVICE_PROVIDER = "ServiceProvider";

/**
 * Single sign-in for the web. Admins land in /admin, service providers in /portal.
 * The two areas keep separate sessions; an account with both roles is signed in to both
 * and lands in /admin.
 */
export default function LoginPage() {
  const { login: adminSignIn } = useAuth();
  const { login: portalSignIn } = usePortalAuth();
  const { setPage } = usePortalPage();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const openPortal = async () => {
    try {
      setPage(await getMyPage());
      navigate(ROUTES.PORTAL_DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        navigate(ROUTES.PORTAL_NO_PAGE, { replace: true });
      } else {
        toast.error("Signed in, but your page couldn't be loaded. Please try again.");
      }
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    let data;
    try {
      data = await portalLogin(values.email, values.password);
    } catch (err) {
      toast.error(errMessage(err, "Invalid credentials."));
      return;
    }

    const isAdmin = data.roles.includes(ROLE_ADMIN);
    const isProvider = data.roles.includes(ROLE_SERVICE_PROVIDER);

    if (!isAdmin && !isProvider) {
      toast.error("Access denied.");
      return;
    }

    if (isProvider) portalSignIn(data.accessToken);

    if (isAdmin) {
      adminSignIn(data.accessToken);
      navigate(ROUTES.ADMIN, { replace: true });
      return;
    }

    await openPortal();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">PetaVerse</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
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

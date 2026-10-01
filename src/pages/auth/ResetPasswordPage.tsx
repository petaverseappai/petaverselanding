import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const APP_URL = import.meta.env.VITE_APP_URL ?? "https://petaverseapp.com";
const MIN_PASSWORD_LENGTH = 6;

// Read a query param straight from the raw query string, NOT via URLSearchParams.
// The reset token is base64url and the backend URI-escapes it, so `+` arrives as
// `%2B`. URLSearchParams decodes `+` as a space (form-urlencoded rule), which
// corrupts the token and makes Identity reject it as "Invalid token". Here we
// take the raw segment and run only decodeURIComponent (which leaves `+` alone);
// as a last-resort fallback we restore any stray space back to `+`.
function rawQueryParam(name: string): string | null {
  const query = window.location.search.replace(/^\?/, "");
  for (const pair of query.split("&")) {
    const eq = pair.indexOf("=");
    const key = eq === -1 ? pair : pair.slice(0, eq);
    if (key !== name) continue;
    const rawValue = eq === -1 ? "" : pair.slice(eq + 1);
    try {
      return decodeURIComponent(rawValue).replace(/ /g, "+");
    } catch {
      return rawValue.replace(/ /g, "+");
    }
  }
  return null;
}

export default function ResetPasswordPage() {
  const token = rawQueryParam("token");
  const userId = rawQueryParam("userId");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Missing or malformed link: nothing to reset against.
  if (!token || !userId) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
        <p className="mt-2 text-sm text-gray-500">
          This password-reset link is missing information or has expired. Please
          request a new one from the app.
        </p>
        <a
          href={APP_URL}
          className="mt-6 inline-block text-sm font-semibold text-paw-orange hover:underline"
        >
          Go to PetaVerse
        </a>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <CheckCircle2 className="mx-auto h-12 w-12 text-paw-green" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Password reset</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your password has been changed. You can now sign in with your new
          password from the PetaVerse app.
        </p>
      </Shell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ userId, token, newPassword: password });
      setDone(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to reset password. The link may have expired.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter a new password for your account.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <Input
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        <div>
          <Input
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        {error && <p className="text-xs text-paw-coral">{error}</p>}

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paw-cream px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-md">
        {children}
      </div>
    </div>
  );
}

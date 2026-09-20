import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/types/auth.types";
import { changePassword } from "@/services/admin";
import { PageHeader, Panel, Field } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm placeholder:text-gray-400 focus:border-paw-orange focus:outline-none focus:ring-1 focus:ring-paw-orange";

function PasswordInput({
  autoComplete,
  register,
  reveal,
  onToggle,
}: {
  autoComplete: string;
  register: ReturnType<ReturnType<typeof useForm<ChangePasswordFormValues>>["register"]>;
  reveal: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative mt-1">
      <input
        type={reveal ? "text" : "password"}
        autoComplete={autoComplete}
        className={inputClass}
        {...register}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
        aria-label={reveal ? "Hide password" : "Show password"}
      >
        {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function SecurityPage() {
  const [reveal, setReveal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed.");
      reset();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error("Failed to change password.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        subtitle="Change the password for your admin account."
      />

      <Panel>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Change password
          </h2>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="max-w-md space-y-4 px-6 py-6"
        >
          <div>
            <Field label="Current password">
              <PasswordInput
                autoComplete="current-password"
                register={register("currentPassword")}
                reveal={reveal}
                onToggle={() => setReveal((v) => !v)}
              />
            </Field>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <Field label="New password">
              <PasswordInput
                autoComplete="new-password"
                register={register("newPassword")}
                reveal={reveal}
                onToggle={() => setReveal((v) => !v)}
              />
            </Field>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <Field label="Confirm new password">
              <PasswordInput
                autoComplete="new-password"
                register={register("confirmPassword")}
                reveal={reveal}
                onToggle={() => setReveal((v) => !v)}
              />
            </Field>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Change password"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

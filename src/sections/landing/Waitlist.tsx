import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PawPrint } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { waitlistSchema, type WaitlistFormValues } from "@/types/waitlist.types";

export function Waitlist() {
  const { t } = useTranslation("landing");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormValues>({ resolver: zodResolver(waitlistSchema) });

  const onSubmit = async (_values: WaitlistFormValues) => {
    // No waitlist endpoint exists on PetsApp.Api yet; this simulates the
    // round trip so the form is real and testable before that endpoint lands.
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(t("waitlist.success"));
    reset();
  };

  return (
    <section id="waitlist" className="py-20 sm:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-paw-orange to-paw-orange-dark px-8 py-16 text-center sm:px-16">
          <PawPrint className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-white/10" />
          <PawPrint className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 text-white/10" />

          <div className="relative mx-auto flex max-w-xl flex-col items-center gap-3">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              {t("waitlist.eyebrow")}
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {t("waitlist.title")}
            </h2>
            <p className="text-white/85">{t("waitlist.subtitle")}</p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <div className="flex-1 text-left">
                <Input
                  type="email"
                  placeholder={t("waitlist.emailPlaceholder")}
                  className="bg-white"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 px-1 text-xs font-medium text-white">
                    {t("waitlist.invalidEmail")}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={isSubmitting}
                className="shrink-0"
              >
                {isSubmitting ? t("waitlist.submitting") : t("waitlist.submit")}
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}

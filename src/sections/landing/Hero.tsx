import { useTranslation } from "react-i18next";
import { ArrowRight, PawPrint } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PhoneFrame } from "@/components/common/PhoneFrame";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { t } = useTranslation("landing");

  return (
    <section id="top" className="relative overflow-hidden pt-8 sm:pt-14">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-paw-orange-light blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-96 h-72 w-72 rounded-full bg-paw-teal-light blur-3xl" />

      <Container className="relative grid items-center gap-14 pb-20 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-paw-orange-light px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-paw-orange-dark">
            <PawPrint className="h-3.5 w-3.5" />
            {t("hero.eyebrow")}
          </span>

          <h1 className="max-w-xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            {t("hero.title")}
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("hero.ctaSecondary")}
            </Button>
          </div>

          <div className="mt-4 grid w-full grid-cols-3 gap-6 border-t border-border pt-6">
            <Stat value="4" label={t("hero.statPets")} />
            <Stat value="12+" label={t("hero.statProviders")} />
            <Stat value="3" label={t("hero.statLanguages")} />
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute -inset-x-10 top-10 h-[420px] rounded-[3rem] bg-gradient-to-b from-paw-orange to-paw-orange-dark/80 sm:-inset-x-16" />
          <PhoneFrame
            src="/assets/screens/home.jpeg"
            alt="Petaverse home screen showing a pet's health score, nutrition and activity"
            className="relative z-10 w-[260px] sm:w-[280px]"
          />
        </div>
      </Container>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-heading text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs leading-snug text-muted-foreground">{label}</span>
    </div>
  );
}

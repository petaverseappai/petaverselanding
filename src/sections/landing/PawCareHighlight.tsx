import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PhoneFrame } from "@/components/common/PhoneFrame";

export function PawCareHighlight() {
  const { t } = useTranslation("landing");
  const bullets = t("pawcare.bullets", { returnObjects: true }) as string[];

  return (
    <section id="pawcare" className="py-20 sm:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="order-2 flex justify-center lg:order-1">
          <PhoneFrame
            src="/assets/screens/pawcare-map.jpeg"
            alt="PawCare map showing nearby veterinary and grooming providers"
            className="w-[240px] sm:w-[260px]"
          />
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <span className="inline-flex w-fit items-center rounded-full bg-paw-teal-light px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-paw-teal-dark">
            {t("pawcare.eyebrow")}
          </span>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {t("pawcare.title")}
          </h2>
          <p className="max-w-md leading-relaxed text-muted-foreground">
            {t("pawcare.description")}
          </p>
          <ul className="flex flex-col gap-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm font-medium text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-paw-teal" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

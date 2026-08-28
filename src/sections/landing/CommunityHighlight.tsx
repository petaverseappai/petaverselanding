import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PhoneFrame } from "@/components/common/PhoneFrame";

export function CommunityHighlight() {
  const { t } = useTranslation("landing");
  const bullets = t("community.bullets", { returnObjects: true }) as string[];

  return (
    <section id="community" className="bg-paw-cream py-20 sm:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full bg-paw-orange-light px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-paw-orange-dark">
            {t("community.eyebrow")}
          </span>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {t("community.title")}
          </h2>
          <p className="max-w-md leading-relaxed text-muted-foreground">
            {t("community.description")}
          </p>
          <ul className="flex flex-col gap-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm font-medium text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-paw-orange" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center">
          <PhoneFrame
            src="/assets/screens/profile.jpeg"
            alt="Pet profiles inside PawHub"
            className="w-[240px] sm:w-[260px]"
          />
        </div>
      </Container>
    </section>
  );
}

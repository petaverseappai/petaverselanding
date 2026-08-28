import { useTranslation } from "react-i18next";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";

export function HowItWorks() {
  const { t } = useTranslation("landing");
  const steps = t("howItWorks.steps", { returnObjects: true }) as {
    title: string;
    description: string;
  }[];

  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow={t("howItWorks.eyebrow")}
          title={t("howItWorks.title")}
        />

        <div className="grid gap-10 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col gap-4">
              <span className="font-heading text-4xl font-bold text-paw-orange">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

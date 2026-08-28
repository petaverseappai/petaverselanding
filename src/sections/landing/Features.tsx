import { useTranslation } from "react-i18next";
import { HeartPulse, Users, Home, MapPinned, Search, Bot } from "lucide-react";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ICONS = [HeartPulse, Users, Home, Search, MapPinned, Bot];
const ACCENTS = [
  "bg-paw-teal-light text-paw-teal-dark",
  "bg-paw-orange-light text-paw-orange-dark",
  "bg-[#EFE6FA] text-paw-purple",
  "bg-[#FCE4E3] text-paw-coral",
  "bg-[#E3EBFE] text-paw-blue",
  "bg-[#E4F5E7] text-paw-green",
];

export function Features() {
  const { t } = useTranslation("landing");
  const items = t("features.items", { returnObjects: true }) as {
    title: string;
    description: string;
  }[];

  return (
    <section id="features" className="py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          subtitle={t("features.subtitle")}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Card key={item.title} className="border-border/80 transition-shadow hover:shadow-md">
                <CardHeader>
                  <div
                    className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl ${ACCENTS[i % ACCENTS.length]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

import { useTranslation } from "react-i18next";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PhoneFrame } from "@/components/common/PhoneFrame";

const SCREENS = [
  { src: "/assets/screens/home.jpg", alt: "Home dashboard with health score and activity" },
  { src: "/assets/screens/pawcare-map.jpeg", alt: "Map of nearby vets, groomers and pet shops" },
  { src: "/assets/screens/pawbot.jpeg", alt: "PawBot assistant chat giving nutrition advice" },
  { src: "/assets/screens/adoption.jpg", alt: "Adoption listing for a dog available near you" },
  { src: "/assets/screens/pawhub.jpg", alt: "Pet social feed inside PetaHub" },
];

export function Showcase() {
  const { t } = useTranslation("landing");

  return (
    <section className="bg-paw-cream py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("showcase.eyebrow")}
          title={t("showcase.title")}
          subtitle={t("showcase.subtitle")}
        />

        <div className="-mx-6 flex gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SCREENS.map((screen) => (
            <PhoneFrame
              key={screen.src}
              src={screen.src}
              alt={screen.alt}
              className="w-[220px] shrink-0 sm:w-[240px]"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

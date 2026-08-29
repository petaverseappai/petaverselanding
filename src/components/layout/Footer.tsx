import { useTranslation } from "react-i18next";
import { Container } from "@/components/common/Container";
import { NAV_LINKS } from "@/constants/nav";

export function Footer() {
  const { t } = useTranslation(["landing", "common"]);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-paw-cream">
      <Container className="flex flex-col gap-10 py-16">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img src="/assets/brand/logo.png" alt="" className="h-8 w-auto" />
              <span className="font-heading text-lg font-bold text-foreground">
                {t("common:appName")}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("landing:footer.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-foreground/70 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} {t("common:appName")}. {t("landing:footer.rights")}
          </p>
        </div>
      </Container>
    </footer>
  );
}

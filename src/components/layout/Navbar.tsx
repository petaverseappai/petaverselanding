import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/constants/nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useTranslation(["nav", "common"]);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors",
        scrolled ? "bg-background/90 shadow-sm backdrop-blur" : "bg-transparent",
      )}
    >
      <Container className="flex h-20 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <img
            src="/assets/brand/paw-mark.svg"
            alt=""
            className="h-9 w-9"
          />
          <span className="font-heading text-xl font-bold text-foreground">
            {t("common:appName")}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild={false} onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}>
            {t("nav:getTheApp")}
          </Button>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col gap-4 py-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-foreground/80"
              >
                {link.label}
              </a>
            ))}
            <Button
              onClick={() => {
                setOpen(false);
                document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("nav:getTheApp")}
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
}

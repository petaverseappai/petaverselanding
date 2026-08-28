import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { NAMESPACES } from "./namespaces";

import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enLanding from "./locales/en/landing.json";

export const LANGUAGE_STORAGE_KEY = "petaverse.language";

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    landing: enLanding,
  },
};

const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

i18n.use(initReactI18next).init({
  resources,
  ns: NAMESPACES,
  defaultNS: "landing",
  lng: storedLanguage === "en" ? "en" : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;

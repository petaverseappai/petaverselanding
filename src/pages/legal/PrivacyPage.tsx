import raw from "../../../legal/privacy-policy/1.0.md?raw";
import { MarkdownDocument } from "./MarkdownDocument";

export default function PrivacyPage() {
  return <MarkdownDocument raw={raw} />;
}

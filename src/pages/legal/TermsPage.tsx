import raw from "../../../legal/terms-and-conditions/1.0.md?raw";
import { MarkdownDocument } from "./MarkdownDocument";

export default function TermsPage() {
  return <MarkdownDocument raw={raw} />;
}

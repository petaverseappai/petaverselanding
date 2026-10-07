import raw from "../../../legal/community-guidelines/1.0.md?raw";
import { MarkdownDocument } from "./MarkdownDocument";

export default function CommunityGuidelinesPage() {
  return <MarkdownDocument raw={raw} />;
}

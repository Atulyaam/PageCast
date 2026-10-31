import { notFound } from "next/navigation";
import { DesignTokenPreview } from "@/components/dev/design-token-preview";

export const metadata = {
  title: "PageCast — Design Tokens Preview (Development Only)",
  description:
    "Internal developer harness for verifying Teletext color tokens, typography, and responsive layouts.",
};

export default function DevDesignTokensPage() {
  // Ensure development-only accessibility
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DesignTokenPreview />;
}

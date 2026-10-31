import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PageCast — Low-Bandwidth Teletext Platform",
  description: "AI-assisted, low-bandwidth, offline-first Teletext information publishing and reading platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


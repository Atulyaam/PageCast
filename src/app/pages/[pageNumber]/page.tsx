import { notFound } from "next/navigation";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
import { isValidPageNumber } from "@/domain/validation/page-number";

interface PageProps {
  params: Promise<{
    pageNumber: string;
  }>;
}

export default async function PageRoute({ params }: PageProps) {
  const { pageNumber } = await params;
  const num = parseInt(pageNumber, 10);

  if (!isValidPageNumber(num)) {
    notFound();
  }

  return <PageCastDeviceShell initialPageNumber={num} mode="reader" />;
}

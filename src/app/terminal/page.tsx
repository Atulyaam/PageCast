import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
import { isValidPageNumber } from "@/domain/validation/page-number";

interface TerminalPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function TerminalPage({ searchParams }: TerminalPageProps) {
  const { page } = await searchParams;
  const num = page ? parseInt(page, 10) : 100;
  const initialPage = isValidPageNumber(num) ? num : 100;

  return <PageCastDeviceShell mode="terminal" initialPageNumber={initialPage} />;
}

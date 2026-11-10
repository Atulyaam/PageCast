import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";

export default function Home() {
  return <PageCastDeviceShell mode="reader" initialPageNumber={100} />;
}

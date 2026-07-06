import { PhoneSetupGate } from "@/components/common/PhoneSetupGate";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PhoneSetupGate>{children}</PhoneSetupGate>;
}

import Link from "next/link";

interface AddBabyButtonProps {
  ariaLabel?: string;
  title?: string;
}

export function AddBabyButton({
  ariaLabel = "เพิ่มเด็ก",
  title = "เพิ่มเด็ก",
}: AddBabyButtonProps) {
  return (
    <Link
      href="/dashboard/babies/new"
      className="shrink-0 w-12 h-12 rounded-full bg-[#f8b4c4] flex items-center justify-center text-black hover:opacity-90"
      title={title}
      aria-label={ariaLabel}
    >
      <span className="text-xl leading-none font-medium">+</span>
    </Link>
  );
}

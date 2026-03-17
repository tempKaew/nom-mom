import Image from "next/image";

interface BabyAvatarProps {
  baby: { id: string; name: string; avatar_url: string | null };
  selected?: boolean;
  onClick?: () => void;
  size?: number;
  className?: string;
}

export function BabyAvatar({
  baby,
  selected = false,
  onClick,
  size = 48,
  className = "",
}: BabyAvatarProps) {
  const baseClass =
    "shrink-0 rounded-full flex items-center justify-center transition-all bg-[#f8b4c4]";
  const selectedClass = selected
    ? "ring-2 ring-offset-2 ring-pink-400"
    : "hover:opacity-90";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`${baseClass} ${selectedClass} ${className}`}
      style={{ width: size, height: size }}
      title={baby.name}
    >
      {baby.avatar_url ? (
        <Image
          src={baby.avatar_url}
          alt=""
          className="w-full h-full rounded-full object-cover"
          width={size}
          height={size}
        />
      ) : (
        <span className="text-gray-700 text-lg font-medium">
          {baby.name.charAt(0)}
        </span>
      )}
    </button>
  );
}

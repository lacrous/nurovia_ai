interface UserAvatarProps {
  size?: number;
  name?: string;
  src?: string;
}

function initialsFromName(name?: string): string {
  if (!name) return "AC";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function UserAvatar({ size = 32, name, src }: UserAvatarProps) {
  const dimension = `${size}px`;
  const fontSize = Math.max(10, Math.round(size * 0.4));
  const initials = initialsFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "User avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover border border-theme/30"
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name ?? "User avatar"}
      className="rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center font-semibold text-gold select-none"
      style={{
        width: dimension,
        height: dimension,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
      }}
    >
      {initials}
    </div>
  );
}
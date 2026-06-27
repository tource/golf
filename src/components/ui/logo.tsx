import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string | null;
}

const sizes = {
  sm: 36,
  md: 44,
  lg: 72,
};

export function Logo({ size = "md", showText = true, href = "/" }: LogoProps) {
  const px = sizes[size];

  const content = (
    <>
      <Image
        src="/logo.png"
        alt="날려보세 골프클럽"
        width={px}
        height={px}
        className="rounded-full object-cover shadow-sm"
        priority={size !== "sm"}
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight text-zinc-900">
          날려보세
        </span>
      )}
    </>
  );

  if (href != null && href !== "") {
    return (
      <Link href={href} className="flex items-center gap-2.5">
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-2.5">{content}</div>;
}

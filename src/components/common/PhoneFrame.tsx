import { cn } from "@/lib/utils";

export function PhoneFrame({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[240px] overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/90 bg-foreground/90 shadow-2xl sm:w-[260px]",
        className,
      )}
    >
      <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
      <img src={src} alt={alt} className="block aspect-[9/19.5] w-full object-cover" />
    </div>
  );
}

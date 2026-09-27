import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "peer h-4 w-4 appearance-none cursor-pointer rounded border-2 border-gray-300 bg-white transition-all checked:border-paw-orange checked:bg-paw-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paw-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <Check className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
    </div>
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

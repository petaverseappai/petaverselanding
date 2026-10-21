import * as React from "react";
import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

// ---------------------------------------------------------------------------
// FormField — label + input + hint/error
// ---------------------------------------------------------------------------

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormSelect — matches Input visual style (rounded-2xl, h-11)
// ---------------------------------------------------------------------------

export function FormSelect({
  className,
  disabled,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      disabled={disabled}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// FormTextarea — matches Input visual style with optional char counter
// ---------------------------------------------------------------------------

export function FormTextarea({
  className,
  maxLength,
  value,
  onChange,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLength?: number }) {
  const len = typeof value === "string" ? value.length : 0;
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "flex w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          maxLength && "pb-7",
          className,
        )}
        {...props}
      />
      {maxLength && (
        <span className="absolute bottom-2.5 right-4 text-xs text-gray-400 select-none">
          {len}/{maxLength}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormSection — titled group of fields with optional description
// ---------------------------------------------------------------------------

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormDivider
// ---------------------------------------------------------------------------

export function FormDivider() {
  return <hr className="border-gray-100" />;
}

// ---------------------------------------------------------------------------
// InputWithPrefix — Input with a fixed left-side prefix (e.g. "@")
// ---------------------------------------------------------------------------

export function InputWithPrefix({
  prefix,
  className,
  wrapperClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  prefix: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-center rounded-2xl border border-input bg-background px-4 focus-within:ring-2 focus-within:ring-ring",
        wrapperClassName,
      )}
    >
      <span className="shrink-0 select-none text-sm text-gray-400 pr-0.5">{prefix}</span>
      <input
        className={cn(
          "flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CheckboxField — styled checkbox with label and optional hint text
// ---------------------------------------------------------------------------

export function CheckboxField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 shrink-0"
      />
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// MediaUploader — drag-and-drop zone with thumbnail grid and remove buttons
// ---------------------------------------------------------------------------

export interface MediaItem {
  assetId: string;
  preview: string;
}

export function MediaUploader({
  items,
  onAdd,
  onRemove,
  uploading,
  accept = "image/*,video/*",
  multiple = true,
  hint,
}: {
  items: MediaItem[];
  onAdd: (files: File[]) => void;
  onRemove: (assetId: string) => void;
  uploading: boolean;
  accept?: string;
  multiple?: boolean;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onAdd(Array.from(files));
  };

  return (
    <div className="flex flex-col gap-3">
      {(items.length > 0 || uploading) && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div key={item.assetId} className="group relative h-24 w-24 shrink-0">
              <img
                src={item.preview}
                alt=""
                className="h-full w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(item.assetId)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-sm transition-colors",
          dragging
            ? "border-paw-orange bg-paw-orange/5 text-paw-orange"
            : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <ImagePlus className="h-6 w-6" />
        <span>Click or drag to add media</span>
        {hint && <span className="text-xs">{hint}</span>}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SingleImageField — clickable image upload area with hover overlay (avatar / banner)
// ---------------------------------------------------------------------------

export function SingleImageField({
  label,
  currentUrl,
  previewUrl,
  onFile,
  uploading,
  shape = "square",
}: {
  label: string;
  currentUrl: string | null;
  previewUrl?: string | null;
  onFile: (file: File) => void;
  uploading: boolean;
  shape?: "square" | "wide";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(currentUrl);

  const preview = previewUrl ?? localPreview;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    onFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50",
          shape === "square" ? "h-24 w-24" : "h-28 w-full",
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="h-full w-full object-cover" />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs font-medium text-white">Change</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </>
            )}
          </div>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

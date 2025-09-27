import { Button } from "@/components/ui/button";
import { Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiptButtonProps {
  onPrint: () => void;
  isPrinting: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function ReceiptButton({
  onPrint,
  isPrinting,
  className,
  variant = "default",
  size = "default",
  label = "Print Receipt"
}: ReceiptButtonProps) {
  return (
    <Button
      onClick={onPrint}
      disabled={isPrinting}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
    >
      {isPrinting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Receipt className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

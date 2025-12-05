import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"svg"> {
  container?: boolean;
}

function Spinner({ className, container = false, ...props }: SpinnerProps) {
  const spinner = (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );

  if (container) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export { Spinner }

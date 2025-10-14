import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
  description?: string
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text = "Loading...",
  description
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative">
        <div className={cn(
          "animate-spin rounded-full border-4 border-gray-200",
          sizeClasses[size]
        )}></div>
        <div className={cn(
          "animate-spin rounded-full border-4 border-primary border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2",
          sizeClasses[size]
        )}></div>
      </div>
      <div className="text-center space-y-2">
        <p className={cn("font-medium text-foreground", textSizeClasses[size])}>
          {text}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export function FullPageLoadingSpinner({ 
  text = "Loading Thesis Archive",
  description = "Please wait while we prepare your dashboard..."
}: Omit<LoadingSpinnerProps, 'size' | 'className'>) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LoadingSpinner 
        size="lg"
        text={text}
        description={description}
      />
    </div>
  )
}

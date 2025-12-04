"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

// SVG dot grid pattern encoded as data URL - emerald green, 20px cells
const dotGridPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cg fill='none' stroke='%23059669' stroke-width='0.4' opacity='0.12'%3E%3Crect width='20' height='20' x='0' y='0'/%3E%3C/g%3E%3Ccircle cx='0' cy='0' r='1.2' fill='%23059669' opacity='0.25'/%3E%3Ccircle cx='20' cy='0' r='1.2' fill='%23059669' opacity='0.25'/%3E%3Ccircle cx='0' cy='20' r='1.2' fill='%23059669' opacity='0.25'/%3E%3Ccircle cx='20' cy='20' r='1.2' fill='%23059669' opacity='0.25'/%3E%3C/svg%3E")`

const bannerVariants = cva(
  "relative w-full flex items-center justify-between gap-4 px-4 py-3 text-sm transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-background border-b",
        info: "bg-blue-50 border-b border-blue-100 text-blue-900 [&>svg]:text-blue-600",
        success: "bg-gradient-to-r from-green-100/80 via-green-50/50 to-transparent border-b border-green-200/50 text-green-900",
        warning: "bg-amber-50 border-b border-amber-100 text-amber-900 [&>svg]:text-amber-600",
        error: "bg-red-50 border-b border-red-100 text-red-900 [&>svg]:text-red-600",
        promotional: "bg-gradient-to-r from-emerald-100/80 via-emerald-50/40 to-white/80 border border-emerald-200/60 text-gray-800 rounded-lg",
        muted: "bg-muted/50 border-b text-muted-foreground",
      },
      size: {
        default: "py-3 px-4",
        sm: "py-2 px-3 text-xs",
        lg: "py-4 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  /** Icon displayed on the left side */
  icon?: React.ReactNode
  /** Main text content */
  children: React.ReactNode
  /** Link text (e.g., "Learn more") */
  linkText?: string
  /** Link href */
  linkHref?: string
  /** Called when link is clicked */
  onLinkClick?: () => void
  /** CTA button text */
  actionText?: string
  /** CTA button variant */
  actionVariant?: ButtonProps["variant"]
  /** Called when action button is clicked */
  onAction?: () => void
  /** Whether to show the close button */
  dismissible?: boolean
  /** Called when close button is clicked */
  onDismiss?: () => void
  /** Whether the banner is currently visible */
  visible?: boolean
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      children,
      linkText,
      linkHref,
      onLinkClick,
      actionText,
      actionVariant = "outline",
      onAction,
      dismissible = true,
      onDismiss,
      visible = true,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(visible)

    React.useEffect(() => {
      setIsVisible(visible)
    }, [visible])

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    if (!isVisible) {
      return null
    }

    return (
      <div
        ref={ref}
        role="banner"
        className={cn(bannerVariants({ variant, size }), className)}
        {...props}
      >
        {/* Dot grid pattern overlay for promotional variant */}
        {variant === "promotional" && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              backgroundImage: dotGridPattern,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0',
              opacity: 0.7,
            }}
            aria-hidden="true"
          />
        )}
        
        <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm">{children}</span>
            {linkText && (
              <a
                href={linkHref || "#"}
                onClick={(e) => {
                  if (onLinkClick) {
                    e.preventDefault()
                    onLinkClick()
                  }
                }}
                className="text-sm font-medium underline underline-offset-4 hover:no-underline shrink-0"
              >
                {linkText}
              </a>
            )}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          {actionText && (
            <Button
              variant={actionVariant}
              size="sm"
              onClick={onAction}
              className={cn(
                variant === "promotional" && "border-emerald-600 text-emerald-700 hover:bg-emerald-50",
                variant === "success" && "border-green-600 text-green-700 hover:bg-green-50"
              )}
            >
              {actionText}
            </Button>
          )}
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md p-1 hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    )
  }
)

Banner.displayName = "Banner"

// Convenience components for specific use cases
const PromoBanner = React.forwardRef<HTMLDivElement, Omit<BannerProps, "variant">>(
  (props, ref) => <Banner ref={ref} variant="promotional" {...props} />
)
PromoBanner.displayName = "PromoBanner"

const InfoBanner = React.forwardRef<HTMLDivElement, Omit<BannerProps, "variant">>(
  (props, ref) => <Banner ref={ref} variant="info" {...props} />
)
InfoBanner.displayName = "InfoBanner"

const SuccessBanner = React.forwardRef<HTMLDivElement, Omit<BannerProps, "variant">>(
  (props, ref) => <Banner ref={ref} variant="success" {...props} />
)
SuccessBanner.displayName = "SuccessBanner"

const WarningBanner = React.forwardRef<HTMLDivElement, Omit<BannerProps, "variant">>(
  (props, ref) => <Banner ref={ref} variant="warning" {...props} />
)
WarningBanner.displayName = "WarningBanner"

const ErrorBanner = React.forwardRef<HTMLDivElement, Omit<BannerProps, "variant">>(
  (props, ref) => <Banner ref={ref} variant="error" {...props} />
)
ErrorBanner.displayName = "ErrorBanner"

export { Banner, PromoBanner, InfoBanner, SuccessBanner, WarningBanner, ErrorBanner, bannerVariants }


"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: number
  title: string
  icon: React.ComponentType<{ className?: string }>
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick: (step: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav className="space-y-1">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id
        
        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
              isActive && "bg-primary/10 text-primary",
              isCompleted && "text-green-600",
              !isActive && !isCompleted && "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-green-500 text-white",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium truncate",
              isActive && "text-primary",
              isCompleted && "text-green-600",
              !isActive && !isCompleted && "text-muted-foreground"
            )}>
              {step.title}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

interface StepContentProps {
  children: React.ReactNode
  currentStep: number
  onNext?: () => void
  onBack?: () => void
  isFirst?: boolean
  isLast?: boolean
  nextLabel?: string
}

export function StepContent({ 
  children, 
  currentStep, 
  onNext, 
  onBack,
  isFirst,
  isLast,
  nextLabel = "Next"
}: StepContentProps) {
  return (
    <div className="space-y-6 pb-20">
      {children}
      
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 -mb-6 mt-6 flex justify-between items-center">
        {!isFirst ? (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        ) : <div />}
        
        {!isLast ? (
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors ml-auto"
          >
            {nextLabel} →
          </button>
        ) : (
          <span className="flex items-center gap-2 text-sm text-green-600 font-medium ml-auto">
            <Check className="h-4 w-4" />
            Ready to save!
          </span>
        )}
      </div>
    </div>
  )
}

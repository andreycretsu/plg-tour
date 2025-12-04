"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Braces } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Variable {
  key: string
  label: string
  description?: string
}

const DEFAULT_VARIABLES: Variable[] = [
  { key: '{{firstName}}', label: 'First Name', description: 'User\'s first name' },
  { key: '{{lastName}}', label: 'Last Name', description: 'User\'s last name' },
  { key: '{{userName}}', label: 'Full Name', description: 'User\'s full name' },
  { key: '{{email}}', label: 'Email', description: 'User\'s email address' },
]

interface VariableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange: (value: string) => void
  variables?: Variable[]
}

export function VariableInput({ onValueChange, variables = DEFAULT_VARIABLES, className, ...props }: VariableInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const insertVariable = (variable: string) => {
    const input = inputRef.current
    if (!input) return

    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const value = input.value
    const newValue = value.substring(0, start) + variable + value.substring(end)
    
    onValueChange(newValue)
    
    // Restore focus and move cursor after inserted variable
    setTimeout(() => {
      input.focus()
      const newPosition = start + variable.length
      input.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        className={`pr-8 ${className}`}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Insert variable"
            >
              <Braces className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {variables.map((v) => (
              <DropdownMenuItem
                key={v.key}
                onClick={() => insertVariable(v.key)}
                className="flex flex-col items-start py-2"
              >
                <span className="font-medium">{v.label}</span>
                <span className="text-xs text-muted-foreground">{v.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

interface VariableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange: (value: string) => void
  variables?: Variable[]
}

export function VariableTextarea({ onValueChange, variables = DEFAULT_VARIABLES, className, ...props }: VariableTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const value = textarea.value
    const newValue = value.substring(0, start) + variable + value.substring(end)
    
    onValueChange(newValue)
    
    // Restore focus and move cursor after inserted variable
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + variable.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        className={`pr-8 min-h-[80px] ${className}`}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Insert variable"
            >
              <Braces className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {variables.map((v) => (
              <DropdownMenuItem
                key={v.key}
                onClick={() => insertVariable(v.key)}
                className="flex flex-col items-start py-2"
              >
                <span className="font-medium">{v.label}</span>
                <span className="text-xs text-muted-foreground">{v.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}


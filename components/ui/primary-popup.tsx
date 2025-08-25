import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog"
import type { ReactNode } from "react"

interface PrimaryPopupProps {
  trigger: ReactNode
  title: string
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  description?: string // Added optional description prop for accessibility
}

export function PrimaryPopup({ trigger, title, children, open, onOpenChange, description }: PrimaryPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

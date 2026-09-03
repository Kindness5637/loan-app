import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// import { CheckCircle, Clock, XCircle, FileText } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
  }).format(numericAmount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: 'short',
    day: "numeric"
  })
}

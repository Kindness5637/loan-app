import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, Loader2, CheckCircle } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import type { Loan } from "@/hooks/userLoans"

interface CommentFormData {
  borrower_id: number
  loan_number: string
  loan_type_id: number
  comment: string
  timestamp: string
}

interface InlineLoanCommentProps {
  loan: Loan
  placeholder?: string
  onSuccess?: () => void
}

export const InlineLoanComment = ({ 
  loan, 
  placeholder = "Write your comment here...",
  onSuccess 
}: InlineLoanCommentProps) => {
  const { user } = useAuth()
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!comment.trim() || !user) {
      toast.error("Please enter a comment")
      return
    }

    setIsSubmitting(true)
    setShowSuccess(false)

    const payload: CommentFormData = {
      borrower_id: user.id,
      loan_number: loan.loan_number,
      loan_type_id: loan.loan_type_id,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      await apiService.post(`/${loan.loan_number}/comments`, payload)
      toast.success("Comment submitted successfully!")
      setComment("")
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Failed to submit comment:", error)
      toast.error("Failed to submit comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={`comment-${loan.loan_number}`} className="text-sm font-medium">
          Add Comment
        </Label>
        <span className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Enter</kbd> to submit
        </span>
      </div>
      
      <Textarea
        id={`comment-${loan.loan_number}`}
        placeholder={placeholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyPress}
        rows={3}
        className="resize-none text-sm"
        maxLength={500}
        disabled={isSubmitting}
      />
      
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {comment.length}/500 characters
        </span>
        
        <Button
          onClick={handleSubmit}
          disabled={!comment.trim() || isSubmitting || comment.length > 500}
          size="sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Post Comment
            </>
          )}
        </Button>
      </div>
      
      {showSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md border border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Comment posted successfully!</span>
        </div>
      )}
    </div>
  )
}
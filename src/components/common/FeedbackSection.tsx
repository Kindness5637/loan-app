import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Star, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { apiService } from "@/services/api";

interface Feedback {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

const FeedbackCard = ({ feedback }: { feedback: Feedback }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{feedback.user_name}</p>
            <p className="text-xs text-muted-foreground">{feedback.user_email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-foreground mb-2">{feedback.comment}</p>
      <p className="text-xs text-muted-foreground">{formatDate(feedback.created_at)}</p>
    </CardContent>
  </Card>
);

export const FeedbackSection = ({ loanCode }: { loanCode: string }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await apiService.get(`/${loanCode}/comments`);
        setFeedbacks(response.data || []);
      } catch (error) {
        console.error("Failed to fetch feedbacks:", error);
        toast.error("Failed to load feedbacks");
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [loanCode]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Customer Feedback ({feedbacks.length})
        </h3>
      </div>

      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No feedback available for this loan product yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {feedbacks.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </div>
      )}
    </div>
  );
};
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Search, User, Calendar, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { apiService } from "@/services/api";
import type { LoanType } from "@/types/loan";

interface Comment {
  timestamp: string;
  user: string;
  text: string;
}

interface CommentItem {
  loan_code: string;
  comment: Comment;
}

interface LoanComment {
  loan_number: string;
  borrower: string;
  comments: CommentItem[];
  total_comments: number;
  last_updated: string;
}

const CommentItemComponent = ({
  commentItem,
  loanTypes,
}: {
  commentItem: CommentItem;
  loanTypes: LoanType[];
}) => {
  const loanCode = commentItem.loan_code.replace(/^LN-/, "");
  const loanType = loanTypes.find((type) => type.loanCode === loanCode);

  return (
    <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm">{commentItem.comment.user}</p>
          <span className="text-xs text-muted-foreground">•</span>
          <p className="text-xs text-muted-foreground">
            {formatDate(commentItem.comment.timestamp)}
          </p>
          {loanType && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <Badge variant="outline" className="text-xs px-2 py-0">
                {loanType.loanType}
              </Badge>
            </>
          )}
        </div>
        <p className="text-sm text-foreground">{commentItem.comment.text}</p>
      </div>
    </div>
  );
};

const LoanCommentCard = ({
  loanComment,
  loanTypes,
}: {
  loanComment: LoanComment;
  loanTypes: LoanType[];
}) => {
  // Get unique loan types for this loan's comments
  const loanTypesForLoan = Array.from(
    new Set(
      loanComment.comments
        .map((commentItem) => {
          const loanCode = commentItem.loan_code.replace(/^LN-/, "");
          return loanTypes.find((type) => type.loanCode === loanCode);
        })
        .filter(Boolean)
        .map((type) => type!.loanType),
    ),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold mb-1">
              {loanComment.loan_number}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Borrower: {loanComment.borrower}
            </p>
            {loanTypesForLoan.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {loanTypesForLoan.map((loanType) => (
                  <Badge key={loanType} variant="secondary" className="text-xs">
                    {loanType}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {loanComment.total_comments}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loanComment.comments.map((commentItem, index) => (
            <CommentItemComponent
              key={index}
              commentItem={commentItem}
              loanTypes={loanTypes}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          Last updated: {formatDate(loanComment.last_updated)}
        </div>
      </CardContent>
    </Card>
  );
};

export const CommentsPage = () => {
  const [loanComments, setLoanComments] = useState<LoanComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<LoanComment[]>([]);
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLoanTypes, setLoadingLoanTypes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoanType, setSelectedLoanType] = useState<string>("all");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await apiService.get("/comments");
        // apiService.get already returns response.data, so we handle accordingly
        const commentsData =
          response && typeof response === "object" && "data" in response
            ? response.data || []
            : Array.isArray(response)
              ? response
              : [];
        setLoanComments(commentsData);
        setFilteredComments(commentsData);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
        toast.error("Failed to load comments");
        setLoanComments([]);
        setFilteredComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  useEffect(() => {
    const fetchLoanTypes = async () => {
      try {
        const response = await apiService.get("/loan-types");

        // apiService.get already returns response.data, so we need to handle it accordingly
        const loanTypesData = Array.isArray(response)
          ? response
          : response?.data || [];

        setLoanTypes(loanTypesData);
      } catch (error) {
        console.error("Failed to fetch loan types:", error);
        toast.error("Failed to load loan types");
        setLoanTypes([]);
      } finally {
        setLoadingLoanTypes(false);
      }
    };

    fetchLoanTypes();
  }, []);

  useEffect(() => {
    let filtered = loanComments;

    // Filter by loan type first
    if (selectedLoanType !== "all") {
      filtered = filtered.filter((loan) =>
        loan.comments.some((commentItem) => {
          // Extract loan code prefix (e.g., "LN-TLF8C" -> "TLF8C" or just use the loan_code)
          const loanCode = commentItem.loan_code.replace(/^LN-/, "");
          return loanTypes.some(
            (type) =>
              type.loanCode === loanCode && type.loanType === selectedLoanType,
          );
        }),
      );
    }

    // Then apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (loan) =>
          loan.loan_number.toLowerCase().includes(query) ||
          loan.borrower.toLowerCase().includes(query) ||
          loan.comments.some(
            (commentItem) =>
              commentItem.comment.text.toLowerCase().includes(query) ||
              commentItem.comment.user.toLowerCase().includes(query),
          ),
      );
    }

    setFilteredComments(filtered);
  }, [searchQuery, selectedLoanType, loanComments, loanTypes]);

  const totalComments = loanComments.reduce(
    (sum, loan) => sum + loan.total_comments,
    0,
  );

  // Get unique loan types from the comments for additional filtering info
  const getUniqueLoanTypes = () => {
    const uniqueTypes = new Set<string>();
    loanComments.forEach((loan) => {
      loan.comments.forEach((commentItem) => {
        const loanCode = commentItem.loan_code.replace(/^LN-/, "");
        const loanType = loanTypes.find((type) => type.loanCode === loanCode);
        if (loanType) {
          uniqueTypes.add(loanType.loanType);
        }
      });
    });
    return Array.from(uniqueTypes).sort();
  };

  const availableLoanTypes = getUniqueLoanTypes();

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLoanType("all");
  };

  if (loading || loadingLoanTypes) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">All Loan Comments</h1>
        <p className="text-muted-foreground">
          View and manage all customer feedback across all loans
        </p>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Loans</p>
                <p className="text-2xl font-bold">{loanComments.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-bold">{totalComments}</p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Loan Types</p>
                <p className="text-2xl font-bold">
                  {availableLoanTypes.length}
                </p>
              </div>
              <Filter className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Filtered Results
                </p>
                <p className="text-2xl font-bold">{filteredComments.length}</p>
              </div>
              <Search className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Type Distribution */}
      {availableLoanTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comments by Loan Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableLoanTypes.map((loanType) => {
                const typeComments = loanComments.filter((loan) =>
                  loan.comments.some((commentItem) => {
                    const loanCode = commentItem.loan_code.replace(/^LN-/, "");
                    return loanTypes.some(
                      (type) =>
                        type.loanCode === loanCode &&
                        type.loanType === loanType,
                    );
                  }),
                );
                const typeCommentsCount = typeComments.reduce(
                  (sum, loan) => sum + loan.total_comments,
                  0,
                );

                return (
                  <div
                    key={loanType}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLoanType(loanType)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm truncate">
                        {loanType}
                      </h4>
                      <Badge variant="outline">{typeCommentsCount}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {typeComments.length} loan(s) • {typeCommentsCount}{" "}
                      comment(s)
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by loan number, borrower, comment, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedLoanType}
                onValueChange={setSelectedLoanType}
              >
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by loan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loan Types</SelectItem>
                  {availableLoanTypes.map((loanType) => (
                    <SelectItem key={loanType} value={loanType}>
                      {loanType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery || selectedLoanType !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filter Summary */}
          {(searchQuery || selectedLoanType !== "all") && (
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              <span>Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedLoanType !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {selectedLoanType}
                  <button onClick={() => setSelectedLoanType("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <span>• {filteredComments.length} result(s) found</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No comments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedLoanType !== "all"
                ? "Try adjusting your filters"
                : "No comments have been submitted yet"}
            </p>
            {(searchQuery || selectedLoanType !== "all") && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredComments.map((loanComment) => (
            <LoanCommentCard
              key={loanComment.loan_number}
              loanComment={loanComment}
              loanTypes={loanTypes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

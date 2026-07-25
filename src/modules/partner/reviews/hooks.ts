import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReviewAggregate, listReviews, replyReview } from "./store";

export const useVendorReviews = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-reviews", partnerId],
    queryFn: () => listReviews(partnerId!),
    enabled: !!partnerId,
  });

export const useVendorReviewAggregate = (partnerId: string | undefined) =>
  useQuery({
    queryKey: ["partner-reviews-agg", partnerId],
    queryFn: () => getReviewAggregate(partnerId!),
    enabled: !!partnerId,
  });

export const useReplyReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: replyReview,
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["partner-reviews", v.partnerId] });
      qc.invalidateQueries({ queryKey: ["partner-reviews-agg", v.partnerId] });
    },
  });
};

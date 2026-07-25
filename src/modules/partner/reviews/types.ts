// V-23 Vendor Reviews — domain types.

export interface VendorReview {
  id: string;
  partnerId: string;
  listingId: string;
  listingName: string;
  consumerName: string;
  bookingRef: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
  vendorReply?: string;
  vendorReplyAt?: string;
}

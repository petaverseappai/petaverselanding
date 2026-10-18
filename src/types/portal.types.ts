// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export interface MyPage {
  id: number;
  name: string;
  handle: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  ownerUserId: string | null;
  isVerified: boolean;
  followerCount: number;
  postCount: number;
  isFollowing: boolean;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface PageUpdateRequest {
  name: string;
  handle: string;
  bio?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  bannerAssetId?: string | null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface PageDashboard {
  followers: number;
  posts: number;
  activeListings: number;
  pendingInquiries: number;
  totalAdoptionsDone: number;
  recentActivity: ActivityItem[];
}

export type ActivityType = "new_inquiry" | "adoption_completed" | "new_follower";

export interface ActivityItem {
  type: ActivityType;
  label: string;
  listingId?: number | null;
  occurredAt: string;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export interface PostMediaItem {
  mediaAssetId: string;
  thumbnailAssetId?: string | null;
  altText?: string;
  durationSeconds?: number | null;
}

export interface PostListItem {
  id: number;
  caption: string | null;
  thumbnailUrl: string | null;
  likes: number;
  comments: number;
  createdAt: string;
  adoptionListing: { id: number; petName: string } | null;
}

export interface PostFeedResult {
  posts: PostListItem[];
  postCount: number;
  hasMore: boolean;
  nextPage: number | null;
  nextCursor: string | null;
}

export interface CreatePostRequest {
  caption?: string;
  locationName?: string;
  media: PostMediaItem[];
}

export interface ListingData {
  petName: string;
  speciesId: number;
  breedId?: number | null;
  gender: "Male" | "Female" | "Unknown";
  dateOfBirth?: string | null;
  sizeId?: number | null;
  coatColorId?: number | null;
  photoAssetId: string;
  description?: string;
  locationLabel?: string;
  latitude?: number | null;
  longitude?: number | null;
  vaccinated?: boolean;
  neutered?: boolean;
  goodWithKids?: boolean;
}

export interface CreatePostWithListingRequest extends CreatePostRequest {
  listing: ListingData;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface ListingListItem {
  id: number;
  petName: string;
  speciesName: string | null;
  locationLabel: string | null;
  applicantCount: number;
  statusId: number;
  statusName: string;
  createdAt: string;
}

export type ListingsResult = ListingListItem[];

export interface ListingDetail {
  id: number;
  petName: string;
  speciesName: string | null;
  breedName: string | null;
  gender: string;
  dateOfBirth: string | null;
  sizeName: string | null;
  coatColorName: string | null;
  photoUrl: string | null;
  description: string | null;
  locationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  vaccinated: boolean;
  neutered: boolean;
  goodWithKids: boolean;
  statusId: number;
  statusName: string;
  createdAt: string;
}

export interface AdoptionRequest {
  id: number;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  statusId: number;
  statusName: string;
  adopterConfirmedAt: string | null;
  appliedAt: string;
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export interface LookupOption {
  id: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Media upload
// ---------------------------------------------------------------------------

export interface MediaUploadResponse {
  assetId: string;
  url?: string;
}

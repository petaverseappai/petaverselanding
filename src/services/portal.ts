import { portalApi } from "@/services/portalAxios";
import { MediaCategory } from "@/constants/mediaCategory";
import { probeVideoDuration, validateMediaFile } from "@/constants/mediaConstraints";
import { compressImage } from "@/lib/imageCompressor";
import type {
  MyPage,
  PageUpdateRequest,
  HandleAvailability,
  PageDashboard,
  PostFeedResult,
  CreatePostRequest,
  CreatePostWithListingRequest,
  ListingsResult,
  ListingDetail,
  ListingData,
  AdoptionRequest,
  LookupOption,
  MediaUploadResponse,
  ProviderBranch,
  ProviderBranchWrite,
} from "@/types/portal.types";

// ---------------------------------------------------------------------------
// My page
// ---------------------------------------------------------------------------

export async function getMyPage(): Promise<MyPage> {
  const { data } = await portalApi.get<MyPage>("/pages/mine");
  return data;
}

export async function getPage(pageId: number): Promise<MyPage> {
  const { data } = await portalApi.get<MyPage>(`/pages/${pageId}`);
  return data;
}

export async function updatePage(pageId: number, body: PageUpdateRequest): Promise<MyPage> {
  const { data } = await portalApi.put<MyPage>(`/pages/${pageId}`, body);
  return data;
}

export async function checkHandleAvailable(
  handle: string,
  signal?: AbortSignal,
): Promise<HandleAvailability> {
  const { data } = await portalApi.get<HandleAvailability>("/pages/handle-available", {
    params: { handle },
    signal,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getPageDashboard(pageId: number): Promise<PageDashboard> {
  const { data } = await portalApi.get<PageDashboard>(`/pages/${pageId}/dashboard`);
  return data;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function getPageFeed(
  pageId: number,
  query: { page?: number; limit?: number } = {},
): Promise<PostFeedResult> {
  const { data } = await portalApi.get<PostFeedResult>(`/pages/${pageId}/feed`, {
    params: query,
  });
  return data;
}

export async function createPost(
  pageId: number,
  body: CreatePostRequest,
): Promise<{ id: number }> {
  const { data } = await portalApi.post<{ id: number }>(`/pages/${pageId}/posts`, body);
  return data;
}

export async function createPostWithListing(
  pageId: number,
  body: CreatePostWithListingRequest,
): Promise<{ id: number }> {
  const { data } = await portalApi.post<{ id: number }>(
    `/pages/${pageId}/posts/with-listing`,
    body,
  );
  return data;
}

export async function createPostForListing(
  pageId: number,
  listingId: number,
  body: CreatePostRequest,
): Promise<{ id: number }> {
  const { data } = await portalApi.post<{ id: number }>(
    `/pages/${pageId}/listings/${listingId}/post`,
    body,
  );
  return data;
}

export async function deletePost(pageId: number, postId: number): Promise<void> {
  await portalApi.delete(`/pages/${pageId}/posts/${postId}`);
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export async function getListings(
  pageId: number,
  query: { statusId?: number } = {},
): Promise<ListingsResult> {
  const { data } = await portalApi.get<ListingsResult>(`/pages/${pageId}/listings`, {
    params: query,
  });
  return data;
}

export async function createListing(
  pageId: number,
  body: ListingData,
): Promise<ListingDetail> {
  const { data } = await portalApi.post<ListingDetail>(`/pages/${pageId}/listings`, body);
  return data;
}

export async function getListing(listingId: number): Promise<ListingDetail> {
  const { data } = await portalApi.get<ListingDetail>(`/adoption/listings/${listingId}`);
  return data;
}

export async function getListingRequests(listingId: number): Promise<AdoptionRequest[]> {
  const { data } = await portalApi.get<AdoptionRequest[]>(
    `/adoption/listings/${listingId}/requests`,
  );
  return data;
}

export async function approveRequest(listingId: number, requestId: number): Promise<void> {
  await portalApi.post(`/adoption/listings/${listingId}/requests/${requestId}/approve`);
}

export async function rejectRequest(listingId: number, requestId: number): Promise<void> {
  await portalApi.post(`/adoption/listings/${listingId}/requests/${requestId}/reject`);
}

export async function completeTransfer(listingId: number, requestId: number): Promise<void> {
  await portalApi.post(`/adoption/listings/${listingId}/requests/${requestId}/complete`);
}

export async function withdrawListing(listingId: number): Promise<void> {
  await portalApi.post(`/adoption/listings/${listingId}/withdraw`);
}

export async function deleteListing(listingId: number): Promise<void> {
  await portalApi.delete(`/adoption/listings/${listingId}`);
}

// ---------------------------------------------------------------------------
// Branches (self-service: provider derived from token, no provider id in route)
// ---------------------------------------------------------------------------

export async function getBranches(): Promise<ProviderBranch[]> {
  const { data } = await portalApi.get<ProviderBranch[]>("/service-providers/me/branches");
  return data;
}

export async function createBranch(body: ProviderBranchWrite): Promise<ProviderBranch> {
  const { data } = await portalApi.post<ProviderBranch>(
    "/service-providers/me/branches",
    body,
  );
  return data;
}

export async function updateBranch(
  branchId: number,
  body: ProviderBranchWrite,
): Promise<ProviderBranch> {
  const { data } = await portalApi.put<ProviderBranch>(
    `/service-providers/me/branches/${branchId}`,
    body,
  );
  return data;
}

export async function deleteBranch(branchId: number): Promise<void> {
  await portalApi.delete(`/service-providers/me/branches/${branchId}`);
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export async function getSpecies(): Promise<LookupOption[]> {
  const { data } = await portalApi.get<LookupOption[]>("/species");
  return data;
}

export async function getBreeds(speciesId: number): Promise<LookupOption[]> {
  const { data } = await portalApi.get<LookupOption[]>(`/species/${speciesId}/breeds`);
  return data;
}

export async function getPetSizes(): Promise<LookupOption[]> {
  const { data } = await portalApi.get<LookupOption[]>("/pet-attributes/sizes");
  return data;
}

export async function getCoatColors(): Promise<LookupOption[]> {
  const { data } = await portalApi.get<LookupOption[]>("/pet-attributes/coat-colors");
  return data;
}

// ---------------------------------------------------------------------------
// Media upload (presigned 3-step flow)
// ---------------------------------------------------------------------------

interface UploadUrlResponse {
  assetId: string;
  uploadUrl: string;
  contentType: string;
}

interface ConfirmUploadResponse {
  id: string;
  url: string;
}

async function getUploadUrl(
  contentType: string,
  fileName: string,
  category: MediaCategory,
  sizeBytes: number,
  durationSeconds: number | null,
): Promise<UploadUrlResponse> {
  const { data } = await portalApi.post<UploadUrlResponse>("/media/upload-url", {
    category,
    contentType,
    fileName,
    sizeBytes,
    durationSeconds,
  });
  return data;
}

async function confirmUpload(assetId: string): Promise<ConfirmUploadResponse> {
  const { data } = await portalApi.post<ConfirmUploadResponse>(`/media/${assetId}/confirm`);
  return data;
}

export async function uploadMedia(
  file: File,
  category: MediaCategory,
): Promise<MediaUploadResponse> {
  const isVideo = file.type.toLowerCase().startsWith("video/");

  // Images are downscaled and re-encoded to JPEG before upload (videos are sent
  // as-is). This keeps legitimate photos well under the size caps and strips EXIF.
  const upload = isVideo ? file : await compressImage(file, category);
  const durationSeconds = isVideo ? await probeVideoDuration(upload) : null;

  const validationError = validateMediaFile(upload, category, durationSeconds);
  if (validationError) throw new Error(validationError);

  const uploadInfo = await getUploadUrl(
    upload.type,
    upload.name,
    category,
    upload.size,
    durationSeconds,
  );
  const putResponse = await fetch(uploadInfo.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": uploadInfo.contentType },
    body: await upload.arrayBuffer(),
  });
  if (!putResponse.ok) throw new Error("Upload failed");
  const confirmed = await confirmUpload(uploadInfo.assetId);
  return { assetId: uploadInfo.assetId, url: confirmed.url };
}

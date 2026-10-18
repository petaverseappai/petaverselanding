export const MediaCategory = {
  UserAvatar:          0,
  PetAvatar:           1,
  Story:               2,
  Post:                3,
  PetDocument:         4,
  PetReport:           5,
  AdoptionListingPhoto: 6,
  CommunityAvatar:     7,
  CommunityBanner:     8,
  ProviderLogo:        9,
  ProviderBanner:      10,
} as const;

export type MediaCategory = typeof MediaCategory[keyof typeof MediaCategory];

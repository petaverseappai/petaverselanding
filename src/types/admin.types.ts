export interface WaitlistEntry {
  id: number;
  email: string;
  joinedAt: string;
}

export interface WaitlistResponse {
  total: number;
  entries: WaitlistEntry[];
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

interface InviteData {
  petName: string;
  petPhoto: string;
  ownerName: string;
  ownerPhoto: string;
  valid: boolean;
  expired: boolean;
}

type PageState = "loading" | "success" | "invalid" | "error";

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setState("invalid");
        return;
      }

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5075/api";
        const { data } = await axios.get<InviteData>(`${backendUrl}/invites/${token}`);
        if (!data.valid || data.expired) {
          setState("invalid");
          return;
        }
        setInvite(data);
        setState("success");
        document.title = `${data.ownerName} invited you to co-own ${data.petName} on PetaVerse`;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setState("invalid");
        } else {
          setState("error");
        }
      }
    };

    fetchInvite();
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#F2A154]" />
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <a href="/" className="mb-8 flex items-center gap-2.5">
          <img src="/assets/brand/logo.png" alt="PetaVerse" className="h-9 w-auto" />
          <span className="text-xl font-bold text-gray-900">PetaVerse</span>
        </a>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite not found</h1>
          <p className="text-gray-500 mb-8">
            This invite link is invalid, has expired, or has already been used.
          </p>
          <DownloadButtons />
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <a href="/" className="mb-8 flex items-center gap-2.5">
          <img src="/assets/brand/logo.png" alt="PetaVerse" className="h-9 w-auto" />
          <span className="text-xl font-bold text-gray-900">PetaVerse</span>
        </a>
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-6">We couldn&apos;t load this invite. Please try again.</p>
          <a href="/" className="text-[#F2A154] hover:underline font-medium">
            Go to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <a href="/" className="mb-8 flex items-center gap-2.5">
        <img src="/assets/brand/logo.png" alt="PetaVerse" className="h-9 w-auto" />
        <span className="text-xl font-bold text-gray-900">PetaVerse</span>
      </a>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="relative inline-block mb-5">
          <img
            src={invite!.petPhoto}
            alt={invite!.petName}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-[#F2A154]/20"
          />
          <img
            src={invite!.ownerPhoto}
            alt={invite!.ownerName}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white absolute -bottom-1 -right-1"
          />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {invite!.ownerName} invited you to co-own
        </h1>
        <p className="text-2xl font-extrabold text-[#F2A154] mb-2">{invite!.petName}</p>
        <p className="text-sm text-gray-500 mb-7">
          Open the PetaVerse app to accept and start co-owning {invite!.petName}.
        </p>

        <DownloadButtons token={token!} />
      </div>
    </div>
  );
}

function DownloadButtons({ token }: { token?: string }) {
  const appStoreUrl = token
    ? `https://apps.apple.com/app/petaverse/id0000000000?pt=invite&ct=${encodeURIComponent(token)}`
    : "https://apps.apple.com/app/petaverse/id0000000000";

  const playStoreUrl = token
    ? `https://play.google.com/store/apps/details?id=com.petaverse.app&referrer=${encodeURIComponent(`invite_token=${token}`)}`
    : "https://play.google.com/store/apps/details?id=com.petaverse.app";

  return (
    <div className="flex flex-col gap-3">
      <a
        href={appStoreUrl}
        className="flex items-center justify-center gap-3 bg-black text-white rounded-xl px-5 py-3 font-medium hover:bg-gray-900 transition-colors"
      >
        <AppleIcon />
        Download on the App Store
      </a>
      <a
        href={playStoreUrl}
        className="flex items-center justify-center gap-3 bg-black text-white rounded-xl px-5 py-3 font-medium hover:bg-gray-900 transition-colors"
      >
        <GooglePlayIcon />
        Get it on Google Play
      </a>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M3.18 23.76c.3.17.64.24.99.2l13.2-11.95L13.65 8.3 3.18 23.76zm17.63-11c-.22-.48-.62-.83-1.11-1.03L17.14 10.4l-3.72 3.37 3.72 3.38 2.59-1.37c.72-.38 1.08-1.07 1.08-1.82zm-18.6-11c-.13.22-.21.48-.21.76v20.96c0 .28.08.54.21.76L14.44 12 2.21 1.76zM13.65 15.7l3.72 3.38-13.2 11.94c-.35.04-.69-.03-.99-.2L13.65 15.7z" />
    </svg>
  );
}

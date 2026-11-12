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
    <div className="flex flex-col items-center gap-3">
      <a href={appStoreUrl} className="transition-opacity hover:opacity-80">
        <img
          src="/assets/badges/appstore.svg"
          alt="Download on the App Store"
          className="h-12 w-auto"
        />
      </a>
      <a href={playStoreUrl} className="transition-opacity hover:opacity-80">
        <img
          src="/assets/badges/googleplay.svg"
          alt="Get it on Google Play"
          className="h-12 w-auto"
        />
      </a>
    </div>
  );
}

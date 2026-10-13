import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF6EF] px-6 text-center">
      <img src="/assets/brand/logo.png" alt="PetaVerse" className="mb-6 h-14 w-auto" />

      <div className="mb-2 text-8xl font-extrabold text-[#F2A154]" style={{ fontFamily: "Baloo 2, sans-serif" }}>
        404
      </div>

      <h1 className="mb-3 text-2xl font-bold text-gray-900" style={{ fontFamily: "Baloo 2, sans-serif" }}>
        Page not found
      </h1>

      <p className="mb-8 max-w-xs text-gray-500">
        This page doesn't exist or may have been moved.
      </p>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-[#F2A154] px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E2863A]"
        >
          Go to home
        </button>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#14A5A6] hover:underline"
        >
          Go back
        </button>
      </div>
    </div>
  );
}

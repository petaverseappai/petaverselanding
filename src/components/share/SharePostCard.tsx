import { AppleIcon, GooglePlayIcon } from "@/components/share/Icons";

interface PostData {
  title: string;
  caption: string | null;
  authorName: string;
  authorAvatarUrl: string;
  imageUrl: string | null;
  appUrl: string;
}

interface SharePostCardProps {
  post: PostData;
}

export function SharePostCard({ post }: SharePostCardProps) {
  const appStoreUrl = "https://apps.apple.com/app/petaverse/id1234567890";
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.petaverse.app";

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Post Image */}
      {post.imageUrl && (
        <div className="w-full h-64 overflow-hidden bg-gray-200">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Author Section */}
        <div className="flex items-center gap-3">
          <img
            src={post.authorAvatarUrl}
            alt={post.authorName}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <div className="font-semibold text-gray-900">{post.authorName}</div>
            <div className="text-sm text-gray-600">on PetaVerse</div>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-gray-800 line-clamp-3">{post.caption}</p>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* CTA Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            To view the full post, download the PetaVerse app:
          </p>
        </div>

        {/* App Store Buttons */}
        <div className="space-y-3">
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-4 bg-black text-white text-center rounded-lg hover:bg-gray-900 transition font-medium text-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <AppleIcon />
              Download on the App Store
            </div>
          </a>

          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-4 bg-black text-white text-center rounded-lg hover:bg-gray-900 transition font-medium text-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <GooglePlayIcon />
              Get it on Google Play
            </div>
          </a>
        </div>

        {/* Already Have It Button */}
        <div className="space-y-3">
          <a
            href={post.appUrl}
            className="block w-full py-3 px-4 border-2 border-blue-600 text-blue-600 text-center rounded-lg hover:bg-blue-50 transition font-medium"
          >
            Open in PetaVerse App
          </a>
        </div>

        {/* Sign In Option */}
        <div className="space-y-3 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <a
            href="/admin/login"
            className="block w-full py-3 px-4 text-gray-700 text-center rounded-lg hover:bg-gray-100 transition font-medium border border-gray-300"
          >
            Sign in to view on web
          </a>
        </div>
      </div>
    </div>
  );
}

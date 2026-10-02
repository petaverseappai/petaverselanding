import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { SharePostCard } from "@/components/share/SharePostCard";
import { ShareNotFoundPage } from "./ShareNotFoundPage";
import { ShareRateLimitPage } from "./ShareRateLimitPage";

interface PostData {
  title: string;
  caption: string | null;
  authorName: string;
  authorAvatarUrl: string;
  imageUrl: string | null;
  appUrl: string;
}

type PageState = "loading" | "success" | "not-found" | "rate-limit" | "error";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostData | null>(null);
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setState("not-found");
        return;
      }

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5075/api";
        const response = await axios.get<PostData>(`${backendUrl}/share/posts/${id}`);
        setPost(response.data);
        setState("success");

        // Update meta tags
        updateMetaTags(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            setState("not-found");
          } else if (error.response?.status === 429) {
            setState("rate-limit");
          } else {
            setState("error");
          }
        } else {
          setState("error");
        }
      }
    };

    fetchPost();
  }, [id]);

  const updateMetaTags = (data: PostData) => {
    // Set title
    document.title = data.title;

    // Helper to set or update meta tag
    const setMeta = (property: string, content: string, isProperty = true) => {
      let element = document.querySelector(
        isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", property);
        } else {
          element.setAttribute("name", property);
        }
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    setMeta("og:title", data.title);
    if (data.caption) {
      setMeta("og:description", data.caption);
    }
    const imageUrl = data.imageUrl ?? data.authorAvatarUrl;
    setMeta("og:image", imageUrl);
    setMeta("og:url", data.appUrl);
    setMeta("og:type", "article");
    setMeta("twitter:card", "summary_large_image");
  };

  if (state === "not-found") {
    return <ShareNotFoundPage />;
  }

  if (state === "rate-limit") {
    return <ShareRateLimitPage />;
  }

  if (state === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">We couldn&apos;t load this post. Please try again.</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go to home
          </a>
        </div>
      </div>
    );
  }

  if (state === "loading" || !post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <SharePostCard post={post} id={id!} />
    </div>
  );
}

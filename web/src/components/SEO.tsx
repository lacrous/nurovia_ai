import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
}

const defaultMeta = {
  title: "Nurovia AI — Autonomous coding intelligence",
  description:
    "Nurovia AI is an autonomous coding companion that debates your bug across multiple expert models, proposes validated fixes, and applies them only with your approval.",
  image: "/logo-512.png",
};

export function SEO({ title, description, image }: SEOProps) {
  const location = useLocation();
  const pageTitle = title ? `${title} — Nurovia AI` : defaultMeta.title;
  const pageDesc = description || defaultMeta.description;
  const pageImage = image || defaultMeta.image;
  const url = typeof window !== "undefined" ? window.location.origin + location.pathname : "";

  useEffect(() => {
    document.title = pageTitle;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (name.startsWith("og:") || name.startsWith("twitter:")) {
          el.setAttribute("property", name);
        } else {
          el.setAttribute("name", name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", pageDesc);
    setMeta("og:title", pageTitle);
    setMeta("og:description", pageDesc);
    setMeta("og:image", pageImage);
    setMeta("og:url", url);
    setMeta("og:type", "website");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDesc);
    setMeta("twitter:image", pageImage);
  }, [pageTitle, pageDesc, pageImage, url]);

  return null;
}

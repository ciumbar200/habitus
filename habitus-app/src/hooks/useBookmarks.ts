import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchListingBookmarkSlugs,
  fetchShowcaseBookmarkSlugs,
  toggleListingBookmark,
  toggleShowcaseBookmark,
} from "@habitus/core";
import { getListingUuidBySlug } from "@habitus/core";
import { getShowcaseUuidBySlug } from "@habitus/core";

export function useBookmarks() {
  const { user } = useAuth();
  const [listingSlugs, setListingSlugs] = useState<Set<string>>(new Set());
  const [showcaseSlugs, setShowcaseSlugs] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!user?.id) {
      setListingSlugs(new Set());
      setShowcaseSlugs(new Set());
      setReady(true);
      return;
    }
    const [listings, showcase] = await Promise.all([
      fetchListingBookmarkSlugs(user.id),
      fetchShowcaseBookmarkSlugs(user.id),
    ]);
    setListingSlugs(listings);
    setShowcaseSlugs(showcase);
    setReady(true);
  }, [user?.id]);

  useEffect(() => {
    setReady(false);
    reload().catch(() => {
      setListingSlugs(new Set());
      setShowcaseSlugs(new Set());
      setReady(true);
    });
  }, [reload]);

  const toggleListing = useCallback(
    async (slug: string, listingUuid?: string) => {
      if (!user?.id) return false;
      const uuid = listingUuid ?? (await getListingUuidBySlug(slug));
      if (!uuid) return false;

      const wasSaved = listingSlugs.has(slug);
      setListingSlugs((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(slug);
        else next.add(slug);
        return next;
      });

      try {
        await toggleListingBookmark(user.id, uuid, wasSaved);
        return true;
      } catch {
        setListingSlugs((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(slug);
          else next.delete(slug);
          return next;
        });
        return false;
      }
    },
    [user?.id, listingSlugs],
  );

  const toggleShowcase = useCallback(
    async (slug: string, memberUuid?: string) => {
      if (!user?.id) return false;
      const uuid = memberUuid ?? (await getShowcaseUuidBySlug(slug));
      if (!uuid) return false;

      const wasSaved = showcaseSlugs.has(slug);
      setShowcaseSlugs((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(slug);
        else next.add(slug);
        return next;
      });

      try {
        await toggleShowcaseBookmark(user.id, uuid, wasSaved);
        return true;
      } catch {
        setShowcaseSlugs((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(slug);
          else next.delete(slug);
          return next;
        });
        return false;
      }
    },
    [user?.id, showcaseSlugs],
  );

  return {
    ready,
    listingSlugs,
    showcaseSlugs,
    isListingSaved: (slug: string) => listingSlugs.has(slug),
    isShowcaseSaved: (slug: string) => showcaseSlugs.has(slug),
    toggleListing,
    toggleShowcase,
    reload,
  };
}

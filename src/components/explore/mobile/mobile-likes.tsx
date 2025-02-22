"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import type { Profile } from "@/db/schema";
import Image from "next/image";
import { useState } from "react";
import confetti from "canvas-confetti";
import { Skeleton } from "@/components/ui/skeleton";

interface MobileLikesProps {
  profiles: Profile[];
  onLikeBack: (profileId: string) => Promise<{ isMatch?: boolean }>;
  onViewProfile: (profile: Profile) => void;
}

export function MobileLikes({
  profiles,
  onLikeBack,
  onViewProfile,
}: MobileLikesProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleLikeBackWithAnimation = async (userId: string) => {
    try {
      const result = await onLikeBack(userId);

      if (result?.isMatch) {
        // Remove from likes view
        setRemovedIds((prev) => new Set([...prev, userId]));

        // Show match celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error("Error in handleLikeBackWithAnimation:", error);
    }
  };

  // Filter out profiles that have been matched
  const visibleProfiles = profiles.filter(
    (profile) => !removedIds.has(profile.userId)
  );

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="grid grid-cols-2 gap-4 p-4">
        <AnimatePresence mode="popLayout">
          {visibleProfiles.map((profile) => (
            <motion.div
              key={profile.userId}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative bg-gradient-to-br from-white to-pink-50 dark:from-background dark:to-pink-950/20 rounded-2xl overflow-hidden border border-pink-100 dark:border-pink-900 hover:border-pink-300 dark:hover:border-pink-700 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => onViewProfile(profile)}
            >
              {/* Profile Photo */}
              <div className="relative aspect-[3/4]">
                {!loadedImages.has(profile.userId) && (
                  <Skeleton className="absolute inset-0 rounded-none bg-gradient-to-br from-muted/30 to-muted/50 animate-pulse" />
                )}
                <Image
                  src={profile.profilePhoto || (profile.photos?.[0] ?? "")}
                  alt={`${profile.firstName}'s photo`}
                  width={300}
                  height={400}
                  className="object-cover"
                  priority
                  onLoadingComplete={() =>
                    setLoadedImages(
                      (prev) => new Set([...prev, profile.userId])
                    )
                  }
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Profile Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white backdrop-blur-sm bg-black/20">
                <h3 className="font-semibold text-base">
                  {profile.firstName}, {profile.age}
                </h3>
                <p className="text-sm text-white/90 line-clamp-1 mt-0.5">
                  {profile.course}
                </p>
              </div>

              {/* Like Back Button */}
              <Button
                size="sm"
                className="absolute top-3 right-3 bg-pink-500/90 hover:bg-pink-600 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeBackWithAnimation(profile.userId);
                }}
              >
                <Heart className="h-4 w-4 mr-1.5" />
                Like Back
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {profiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 text-center py-16 space-y-6"
          >
            <div className="text-6xl animate-bounce">💫</div>
            <div className="space-y-3">
              <p className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                No likes yet
              </p>
              <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                Keep swiping Someone special might like you soon ✨
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
}

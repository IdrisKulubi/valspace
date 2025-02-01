import {
  getSwipableProfiles,
 
} from "@/lib/actions/explore.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SwipeStack } from "@/components/explore/cards/swipe-stack";
import { NoMoreProfiles } from "@/components/explore/empty-state";
import { type Profile } from "@/db/schema";
import { getCurrentUserProfile } from "@/lib/actions/profile.actions";
import { ExploreMobileV2 } from "@/components/explore/mobile/explore-mobile-v2";

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const currentUserProfile = await getCurrentUserProfile();
  if (!currentUserProfile) redirect("/profile/setup");

  const profiles = await getSwipableProfiles();

  return (
    <div className="min-h-screen">
      
      {/* Mobile View */}
      <div className="md:hidden">
        <ExploreMobileV2
          initialProfiles={profiles as Profile[]}
          currentUserProfile={currentUserProfile}
          currentUser={session.user}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block container mx-auto px-4 pt-24">
        <div className="max-w-2xl mx-auto">
          {profiles.length > 0 ? (
            <SwipeStack 
              initialProfiles={profiles as Profile[]}
              currentUserProfile={currentUserProfile}
              likedByProfiles={[]}
              currentUser={session.user}
            />
          ) : (
            <NoMoreProfiles initialLikedProfiles={[]} currentUser={session.user} />
          )}
        </div>
      </div>
    </div>
  );
}

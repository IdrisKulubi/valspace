import { getSwipableProfiles } from "@/lib/actions/explore.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SwipeStack } from "@/components/explore/cards/swipe-stack";

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const profilesResult = await getSwipableProfiles();
  const profiles = profilesResult.map((p) => p.profiles);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white dark:from-pink-950/30 dark:to-background">
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="relative mb-12">
          <div
            aria-hidden="true"
            className="absolute -top-6 right-1/4 text-pink-500/10 text-7xl select-none animate-float"
          >
            💖
          </div>
          <div
            aria-hidden="true"
            className="absolute -top-4 left-1/4 text-pink-500/10 text-6xl select-none rotate-[-15deg] animate-float delay-1000"
          >
            🌟
          </div>

          <div className="relative mx-auto max-w-2xl text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-3 text-gradient bg-gradient-to-r from-pink-500 to-pink-700 dark:from-pink-400 dark:to-pink-600 bg-clip-text text-transparent">
              Find Your Valentine 💘
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Swipe right on profiles that spark joy ✨ Left if it&apos;s not
              your vibe
            </p>
          </div>
        </div>

        <div className="w-full flex justify-center">
          {profiles.length > 0 ? (
            <SwipeStack initialProfiles={profiles} />
          ) : (
            <div className="text-center py-12 space-y-6 max-w-md mx-auto">
              <p className="text-xl md:text-2xl font-medium text-pink-600/80">
                No more profiles to swipe... for now 🌹
              </p>
              <p className="text-lg text-muted-foreground">
                Check back later or update your preferences
              </p>
              <div className="animate-pulse text-2xl">✨💫✨</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

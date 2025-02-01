/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import db from "@/db/drizzle";
import { profiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { deleteUploadThingFile } from "./upload.actions";
import { z } from "zod";
import { profileSchema } from "../validators";
import { cacheProfilePicture, getCachedProfilePicture } from "../redis";

export type ProfileFormData = z.infer<typeof profileSchema> & {
  firstName: string;
  lastName: string;
  photos: string[];
  bio: string;
  interests: string[];
  lookingFor: "friends" | "dating" | "both";
  course: string;
  yearOfStudy: number;
  instagram?: string;
  spotify?: string;
  snapchat?: string;
  gender: "male" | "female" | "non-binary" | "other";
  age: number;
  profilePhoto?: string;
  phoneNumber: string;
};

export async function getProfile() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      console.error("No user email in session");
      return null;
    }

    // Find user by email
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user || user.length === 0) {
      console.error("User not found by email:", session.user.email);
      throw new Error("User not found");
    }

    const actualUserId = user[0].id;

    // Get profile data
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, actualUserId))
      .limit(1);

    if (!profile || profile.length === 0) return null;

    let cachedProfilePhoto = null;
    try {
      // Only attempt to get cached photo if Redis is configured
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        cachedProfilePhoto = await getCachedProfilePicture(actualUserId);
      }
    } catch (redisError) {
      console.warn("Redis cache unavailable:", redisError);
    }
    
    return {
      ...profile[0],
      phoneNumber: user[0].phoneNumber,
      profilePhoto: cachedProfilePhoto || profile[0].profilePhoto
    };
  } catch (error) {
    console.error("Error in getProfile:", error);
    throw error;
  }
}

export async function updateProfile(data: ProfileFormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    // Find user by email
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user || user.length === 0) {
      return { success: false, error: "User not found" };
    }

    const actualUserId = user[0].id;

    // Transform social fields before validation
    const processedData = {
      ...data,
      instagram: data.instagram ?? "",
      spotify: data.spotify ?? "",
      snapchat: data.snapchat ?? "",
    };

    // Validate the processed data
    const validatedData = await profileSchema.safeParseAsync(processedData);
    if (!validatedData.success) {
      console.error("Validation errors:", validatedData.error);
      return {
        success: false,
        error: "Invalid profile data",
      };
    }

    // Update the profile using validated data
    const updatedProfile = await db
      .update(profiles)
      .set({
        firstName: processedData.firstName,
        lastName: processedData.lastName,
        phoneNumber: processedData.phoneNumber,
        bio: processedData.bio,
        interests: processedData.interests,
        lookingFor: processedData.lookingFor,
        course: processedData.course,
        yearOfStudy: processedData.yearOfStudy,
        instagram: processedData.instagram,
        spotify: processedData.spotify,
        snapchat: processedData.snapchat,
        gender: processedData.gender,
        age: processedData.age,
        photos: processedData.photos,
        profilePhoto: processedData.profilePhoto,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, actualUserId))
      .returning();

    if (!updatedProfile || updatedProfile.length === 0) {
      return {
        success: false,
        error: "Failed to update profile",
      };
    }

    // Only attempt to cache if Redis is configured
    if (processedData.profilePhoto && 
        process.env.UPSTASH_REDIS_REST_URL && 
        process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        await cacheProfilePicture(actualUserId, processedData.profilePhoto);
      } catch (redisError) {
        console.warn("Failed to cache profile picture:", redisError);
      }
    }

    revalidatePath("/profile");
    return {
      success: true,
      profile: updatedProfile[0],
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Failed to update profile. Please try again!",
    };
  }
}

export async function submitProfile(data: ProfileFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db
      .update(profiles)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        photos: data.photos,
        bio: data.bio,
        interests: data.interests,
        lookingFor: data.lookingFor,
        course: data.course,
        yearOfStudy: data.yearOfStudy,
        instagram: data.instagram || "",
        spotify: data.spotify || "",
        snapchat: data.snapchat || "",
        gender: data.gender,
        age: data.age,
        profilePhoto: data.profilePhoto,
        updatedAt: new Date(),
        profileCompleted: true,
      })
      .where(eq(profiles.userId, session.user.id));

    // Cache the profile photo if provided
    if (data.profilePhoto) {
      await cacheProfilePicture(session.user.id, data.profilePhoto);
    }

    revalidatePath("/explore");
    revalidatePath("/explore");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Failed to update profile. Please try again 😢",
      validationErrors: error instanceof Error ? [error] : [],
    };
  }
}

export async function updateProfilePhoto(photoUrl: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    await db
      .update(profiles)
      .set({ profilePhoto: photoUrl })
      .where(eq(profiles.userId, session.user.id));

    // Update the cache with the new photo URL
    await cacheProfilePicture(session.user.id, photoUrl);

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile photo:", error);
    return {
      success: false,
      error: "Failed to update profile photo. Please try again 😢",
    };
  }
}

export async function removePhoto(photoUrl: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const profile = await getProfile();
    if (!profile) {
      return {
        success: false,
        error: "Profile not found",
      };
    }

    // Ensure at least one photo remains
    if (profile.photos && profile.photos.length <= 1) {
      return {
        success: false,
        error: "You must keep at least one photo 📸",
      };
    }

    const updatedPhotos = profile.photos?.filter((p) => p !== photoUrl);
    await db
      .update(profiles)
      .set({ photos: updatedPhotos })
      .where(eq(profiles.userId, session.user.id));

    // Delete the photo from storage
    await deleteUploadThingFile(photoUrl);

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error removing photo:", error);
    return {
      success: false,
      error: "Failed to remove photo. Please try again😢",
    };
  }
}

export async function getCurrentUserProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  return userProfile;
}

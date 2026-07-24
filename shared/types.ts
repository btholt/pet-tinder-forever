import type { pets, swipes } from "../server/db/schema.ts";
import type { InferSelectModel } from "drizzle-orm";

export type PetRow = InferSelectModel<typeof pets>;
export type SwipeRow = InferSelectModel<typeof swipes>;

export type SwipeDirection = "like" | "pass";

export interface Pet {
  id: number;
  name: string;
  shelterName: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "reptile";
  breed: string;
  ageMonths: number;
  gender: "male" | "female";
  size: "small" | "medium" | "large";
  bio: string;
  traits: string[];
  city: string;
  state: string;
  photos: string[];
  adoptionFee: number;
}

export interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SwipeRequestBody {
  petId: number;
  direction: SwipeDirection;
}

export interface SwipeResponse {
  matched: boolean;
}

export interface ApiErrorBody {
  error: string;
}

export function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    name: row.name,
    shelterName: row.shelterName,
    species: row.species,
    breed: row.breed,
    ageMonths: row.ageMonths,
    gender: row.gender,
    size: row.size,
    bio: row.bio,
    traits: row.traits,
    city: row.city,
    state: row.state,
    photos: row.photos,
    adoptionFee: row.adoptionFee,
  };
}

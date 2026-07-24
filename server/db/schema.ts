import {
  pgEnum,
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.ts";

export const petSpeciesEnum = pgEnum("pet_species", [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "reptile",
]);

export const petGenderEnum = pgEnum("pet_gender", ["male", "female"]);

export const petSizeEnum = pgEnum("pet_size", ["small", "medium", "large"]);

export const swipeDirectionEnum = pgEnum("swipe_direction", ["like", "pass"]);

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shelterName: text("shelter_name").notNull().default("Pawmarks Rescue"),
  species: petSpeciesEnum("species").notNull(),
  breed: text("breed").notNull(),
  ageMonths: integer("age_months").notNull(),
  gender: petGenderEnum("gender").notNull(),
  size: petSizeEnum("size").notNull(),
  bio: text("bio").notNull(),
  traits: text("traits").array().notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  photos: text("photos").array().notNull(),
  adoptionFee: integer("adoption_fee").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const swipes = pgTable(
  "swipes",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    petId: integer("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    direction: swipeDirectionEnum("direction").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("swipes_user_pet_unique_idx").on(table.userId, table.petId),
    index("swipes_user_direction_idx").on(table.userId, table.direction),
  ]
);

ALTER TABLE "pets" ADD COLUMN "shelter_name" text DEFAULT 'Pawmarks Rescue' NOT NULL;
UPDATE "pets"
SET "shelter_name" = "city" || ' Humane Society'
WHERE "shelter_name" = 'Pawmarks Rescue';
-- CreateEnum
CREATE TYPE "TeamSelectionMode" AS ENUM ('RANDOM', 'SELECTED');

-- AlterTable: add team_selection_mode to matches (default SELECTED so existing rows are valid)
ALTER TABLE "matches" ADD COLUMN "team_selection_mode" "TeamSelectionMode" NOT NULL DEFAULT 'SELECTED';

-- AlterTable: relax team on match_participants to nullable (RANDOM mode populates it later)
ALTER TABLE "match_participants" ALTER COLUMN "team" DROP NOT NULL;

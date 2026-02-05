-- Drop the old unique index that enforced global uniqueness on code
DROP INDEX IF EXISTS "public"."Asset_code_key";

-- Create a new unique index that enforces uniqueness on (userId, code) pair
-- This allows different users to have the same asset code (e.g. AAPL)
CREATE UNIQUE INDEX "Asset_userId_code_key" ON "public"."Asset"("userId", "code");

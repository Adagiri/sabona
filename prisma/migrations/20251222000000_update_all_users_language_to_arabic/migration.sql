-- Update all existing users' preferredLanguage to Arabic
UPDATE "User"
SET "preferredLanguage" = 'ar'
WHERE "preferredLanguage" IS DISTINCT FROM 'ar';
-- Convert transferChargeType from TEXT to ServiceChargeType enum
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AdminSettings' 
        AND column_name = 'transferChargeType'
        AND data_type = 'text'
    ) THEN
        -- Step 1: Drop the default
        ALTER TABLE "AdminSettings" 
        ALTER COLUMN "transferChargeType" DROP DEFAULT;
        
        -- Step 2: Convert to enum
        ALTER TABLE "AdminSettings" 
        ALTER COLUMN "transferChargeType" 
        TYPE "ServiceChargeType" 
        USING "transferChargeType"::"ServiceChargeType";
        
        -- Step 3: Re-add the default as enum
        ALTER TABLE "AdminSettings" 
        ALTER COLUMN "transferChargeType" 
        SET DEFAULT 'PERCENTAGE'::"ServiceChargeType";
    END IF;
END $$;

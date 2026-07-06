-- Enable pg_trgm extension for fuzzy OEM search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for OEM and cross code normalized fields
CREATE INDEX IF NOT EXISTS "OEMCode_codeNormalized_trgm_idx"
  ON "OEMCode" USING gin ("codeNormalized" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CrossCode_codeNormalized_trgm_idx"
  ON "CrossCode" USING gin ("codeNormalized" gin_trgm_ops);

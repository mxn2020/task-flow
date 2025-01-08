-- API Keys Table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false}'::jsonb,
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(prefix)
);

-- API Key Usage Table
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(prefix);
CREATE INDEX idx_api_key_usage_api_key_id ON api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_timestamp ON api_key_usage(timestamp);

-- API key usage
ALTER TABLE api_key_usage ADD COLUMN response_time INTEGER;
ALTER TABLE api_key_usage ADD COLUMN request_body_size INTEGER;
ALTER TABLE api_key_usage ADD COLUMN response_body_size INTEGER;

CREATE OR REPLACE VIEW api_usage_metrics AS
SELECT 
  date_trunc('hour', timestamp) as time_bucket,
  api_key_id,
  COUNT(*) as request_count,
  AVG(response_time) as avg_response_time,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
  SUM(request_body_size + response_body_size) / 1024.0 as total_kb
FROM api_key_usage
GROUP BY 1, 2;

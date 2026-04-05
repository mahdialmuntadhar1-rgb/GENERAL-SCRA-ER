-- ============================================================================
-- SCRAPER DATA RESET FUNCTIONS
-- Safe deletion of all scraper-related data with confirmation tracking
-- ============================================================================

-- Table to track reset operations (audit log)
CREATE TABLE IF NOT EXISTS scraper_reset_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by TEXT,
  tables_affected TEXT[],
  records_deleted JSONB,
  reason TEXT,
  confirmation_code TEXT -- User must provide this to confirm destructive action
);

-- Function to safely count records in all scraper tables
CREATE OR REPLACE FUNCTION get_scraper_table_counts()
RETURNS TABLE (table_name TEXT, record_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 'businesses_import_raw'::TEXT, COUNT(*)::BIGINT FROM businesses_import_raw
  UNION ALL
  SELECT 'businesses_staging'::TEXT, COUNT(*)::BIGINT FROM businesses_staging
  UNION ALL
  SELECT 'businesses_review_queue'::TEXT, COUNT(*)::BIGINT FROM businesses_review_queue
  UNION ALL
  SELECT 'job_queue'::TEXT, COUNT(*)::BIGINT FROM job_queue
  UNION ALL
  SELECT 'businesses'::TEXT, COUNT(*)::BIGINT FROM businesses WHERE source = 'osm' OR source IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset all scraper data (REQUIRES confirmation code)
CREATE OR REPLACE FUNCTION reset_scraper_data(confirmation_code TEXT, reason TEXT DEFAULT 'User requested reset')
RETURNS JSONB AS $$
DECLARE
  counts JSONB := '{}'::JSONB;
  deleted_counts JSONB := '{}'::JSONB;
  expected_code TEXT;
  actual_code TEXT;
BEGIN
  -- Generate confirmation code based on current timestamp (changes every minute)
  expected_code := 'RESET_' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24-MI');
  actual_code := UPPER(TRIM(confirmation_code));
  
  IF actual_code != expected_code THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid confirmation code',
      'expected_code_pattern', 'RESET_YYYY-MM-DD-HH24-MI',
      'hint', 'Current valid code: ' || expected_code
    );
  END IF;
  
  -- Get pre-delete counts
  SELECT jsonb_object_agg(table_name, record_count)
  INTO counts
  FROM get_scraper_table_counts();
  
  -- Delete from staging tables (safe to delete)
  DELETE FROM businesses_staging;
  deleted_counts := deleted_counts || jsonb_build_object('businesses_staging', (SELECT COUNT(*)::INT FROM businesses_staging));
  
  DELETE FROM businesses_import_raw;
  deleted_counts := deleted_counts || jsonb_build_object('businesses_import_raw', (SELECT COUNT(*)::INT FROM businesses_import_raw));
  
  DELETE FROM businesses_review_queue;
  deleted_counts := deleted_counts || jsonb_build_object('businesses_review_queue', (SELECT COUNT(*)::INT FROM businesses_review_queue));
  
  -- Clear job queue (completed/failed jobs)
  DELETE FROM job_queue WHERE status IN ('completed', 'failed');
  deleted_counts := deleted_counts || jsonb_build_object('job_queue_cleared', (SELECT COUNT(*)::INT FROM job_queue WHERE status IN ('completed', 'failed')));
  
  -- Optionally delete OSM-sourced businesses from production (with extra check)
  -- This is destructive - only deletes if explicitly confirmed
  IF reason ILIKE '%include production%' OR reason ILIKE '%delete all%' THEN
    DELETE FROM businesses WHERE source = 'osm' OR source IS NULL;
    GET DIAGNOSTICS deleted_counts = deleted_counts || jsonb_build_object('businesses_deleted', ROW_COUNT);
  END IF;
  
  -- Log the reset operation
  INSERT INTO scraper_reset_log (performed_by, tables_affected, records_deleted, reason, confirmation_code)
  VALUES (current_user, ARRAY['businesses_staging', 'businesses_import_raw', 'businesses_review_queue', 'job_queue'], 
          deleted_counts, reason, actual_code);
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_counts', counts,
    'deleted_summary', deleted_counts,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current reset confirmation code (for UI display)
CREATE OR REPLACE FUNCTION get_reset_confirmation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RESET_' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24-MI');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCRAPER TASK QUEUE TABLE
-- For sequential, one-by-one processing of governorate+category combinations
-- ============================================================================

CREATE TABLE IF NOT EXISTS scraper_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  governorate TEXT NOT NULL,
  category_key TEXT NOT NULL,
  category_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retrying')),
  
  -- Progress tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  -- Results
  businesses_found INT DEFAULT 0,
  businesses_validated INT DEFAULT 0,
  businesses_needs_review INT DEFAULT 0,
  error_message TEXT,
  
  -- Ordering for sequential execution
  task_order INT NOT NULL,
  
  -- Raw data for debugging
  raw_params JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queue operations
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_job_id ON scraper_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_status ON scraper_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_order ON scraper_tasks(task_order);
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_running ON scraper_tasks(job_id, status) WHERE status = 'running';

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_scraper_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scraper_tasks_updated_at ON scraper_tasks;
CREATE TRIGGER scraper_tasks_updated_at
  BEFORE UPDATE ON scraper_tasks
  FOR EACH ROW EXECUTE FUNCTION update_scraper_tasks_updated_at();

-- Function to get next pending task for a job
CREATE OR REPLACE FUNCTION get_next_scraper_task(p_job_id TEXT)
RETURNS TABLE (
  task_id UUID,
  governorate TEXT,
  category_key TEXT,
  category_name TEXT,
  retry_count INT,
  max_retries INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.governorate,
    t.category_key,
    t.category_name,
    t.retry_count,
    t.max_retries
  FROM scraper_tasks t
  WHERE t.job_id = p_job_id
    AND t.status = 'pending'
  ORDER BY t.task_order
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to mark task as running
CREATE OR REPLACE FUNCTION start_scraper_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE scraper_tasks
  SET status = 'running',
      started_at = NOW(),
      retry_count = retry_count + 1
  WHERE id = p_task_id
    AND status IN ('pending', 'retrying', 'failed');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a task
CREATE OR REPLACE FUNCTION complete_scraper_task(
  p_task_id UUID,
  p_businesses_found INT DEFAULT 0,
  p_businesses_validated INT DEFAULT 0,
  p_businesses_needs_review INT DEFAULT 0
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE scraper_tasks
  SET status = 'completed',
      completed_at = NOW(),
      businesses_found = p_businesses_found,
      businesses_validated = p_businesses_validated,
      businesses_needs_review = p_businesses_needs_review,
      error_message = NULL
  WHERE id = p_task_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to fail a task (with auto-retry logic)
CREATE OR REPLACE FUNCTION fail_scraper_task(
  p_task_id UUID,
  p_error_message TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_retry_count INT;
  v_max_retries INT;
BEGIN
  SELECT retry_count, max_retries
  INTO v_retry_count, v_max_retries
  FROM scraper_tasks
  WHERE id = p_task_id;
  
  IF v_retry_count >= v_max_retries THEN
    UPDATE scraper_tasks
    SET status = 'failed',
        error_message = p_error_message,
        completed_at = NOW()
    WHERE id = p_task_id;
    RETURN 'failed';
  ELSE
    UPDATE scraper_tasks
    SET status = 'retrying',
        error_message = p_error_message
    WHERE id = p_task_id;
    RETURN 'retrying';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get job progress summary
CREATE OR REPLACE FUNCTION get_scraper_job_progress(p_job_id TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'job_id', p_job_id,
    'total_tasks', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'running', COUNT(*) FILTER (WHERE status = 'running'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'retrying', COUNT(*) FILTER (WHERE status = 'retrying'),
    'current_task', (
      SELECT jsonb_build_object(
        'governorate', governorate,
        'category_name', category_name,
        'started_at', started_at
      )
      FROM scraper_tasks
      WHERE job_id = p_job_id AND status = 'running'
      LIMIT 1
    ),
    'totals', jsonb_build_object(
      'businesses_found', SUM(businesses_found),
      'businesses_validated', SUM(businesses_validated),
      'businesses_needs_review', SUM(businesses_needs_review)
    )
  )
  INTO result
  FROM scraper_tasks
  WHERE job_id = p_job_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE scraper_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_reset_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated service role
CREATE POLICY scraper_tasks_service_all ON scraper_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY scraper_reset_log_service_all ON scraper_reset_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow read-only for anon (if needed for public status pages)
CREATE POLICY scraper_tasks_anon_read ON scraper_tasks
  FOR SELECT TO anon USING (true);

CREATE POLICY scraper_reset_log_anon_read ON scraper_reset_log
  FOR SELECT TO anon USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE scraper_tasks IS 'Individual scraper tasks for sequential governorate+category processing';
COMMENT ON TABLE scraper_reset_log IS 'Audit log of all data reset operations';
COMMENT ON FUNCTION reset_scraper_data IS 'Resets all scraper data. Requires confirmation code format: RESET_YYYY-MM-DD-HH24-MI';

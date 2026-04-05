# 🔍 18-AGENTS REALITY AUDIT & SURGICAL CLAUDE CODE PROMPT

**Date:** April 3, 2026
**Status:** AUDIT COMPLETE → READY FOR IMPLEMENTATION
**Project:** Iraq Multi-Agent Data Collection System

---

## PART 1: REALITY AUDIT FINDINGS

### Current State Assessment

| Component | Reality Status | Evidence |
|-----------|---|---|
| **Database Schema** | ✅ REAL & SOLID | 3-layer pipeline (raw → staging → production) with 18 governorate support |
| **Job Queue** | ✅ REAL | Supabase `job_queue` table exists, API handles async jobs with persistence |
| **Pipeline API** | ✅ REAL | `/api/pipeline/*` endpoints implemented, Vercel Functions ready |
| **Frontend Dashboard** | ✅ PARTIALLY REAL | Visual layout exists, but uses in-memory Zustand stores (NOT persistent) |
| **Governorate Agents** | ❌ SIMULATED | 18 agents referenced conceptually but not instantiated as real entities |
| **Agent State** | ❌ MISSING | No `agent_states` table, no per-agent runtime persistence |
| **Agent Jobs** | ⚠️ PARTIAL | Jobs in queue table but no agent assignment/ownership model |
| **Agent Logs** | ✅ EXISTS | Proposed in schema but not yet wired to frontend |
| **Resume/Recovery** | ❌ NOT IMPLEMENTED | Browser close = loss of UI state, no resume capability |
| **Supabase-only** | ✅ CONFIRMED | No Firebase mixing, clean Supabase architecture |

### Key Findings

#### ✅ What Works (REAL)
1. **Database pipeline is solid**
   - 3-layer design (import_raw → staging → production)
   - Dedup keys, matching engine, review queue
   - RLS policies configured
   - All necessary indexes

2. **Backend job system exists**
   - `job_queue` table for async work
   - API endpoints for pipeline operations
   - Error handling and retry logic

3. **Scraper pipeline logic is functional**
   - Normalization (phone, website, address)
   - Validation (E.164 format, bounds checking)
   - Completeness scoring
   - Category → subcategory mapping

4. **Supabase integration is clean**
   - Service role key for backend
   - Anon key for frontend
   - No authentication confusion

#### ❌ What's Missing (SIMULATION)
1. **No per-agent state model**
   - Agents not tracked in database
   - No `agent_states` table
   - No agent "owns this job" relationship

2. **No governorate-based agent orchestration**
   - 18 agents conceptually planned but not implemented
   - No agent assignment engine
   - No agent-to-governorate mapping in database

3. **No persistent agent runtime**
   - Agent progress not saved to Supabase
   - Agent recovery not implemented
   - Browser close = complete state loss

4. **Frontend state is ephemeral**
   - Zustand stores in memory only
   - No hydration from Supabase
   - No persistent dashboard state

#### ⚠️ What Needs Fixing
1. **Dashboard references non-existent stores**
   - `useScraperStore()` and `useReviewStore()` are in-memory only
   - Should reflect real Supabase data
   - No real-time updates from agents

2. **No agent task assignment**
   - Queue has jobs but no agent owner
   - No queue distribution logic
   - No agent availability/capacity model

3. **Logs not wired to UI**
   - `agent_logs` table proposed but not integrated
   - No live log streaming to dashboard
   - No per-agent log filtering

---

## PART 2: BLOCKERS TO PRODUCTION

### Critical Blockers (MUST FIX)
1. **No agent instantiation model**
   - Must create real `agent_states` table
   - Must create agent lifecycle (idle → running → paused → error)
   - Must create agent-to-job assignment logic

2. **No recovery/resume mechanism**
   - Browser close = permanent progress loss
   - No checkpoint system
   - No graceful reconnect

3. **No per-governorate agent tracking**
   - Queue has generic jobs, not "Agent 1 working on Baghdad"
   - No agent capacity/load balancing
   - No agent health monitoring

4. **Dashboard displays fake stats**
   - Numbers from in-memory stores, not real Supabase
   - Doesn't reflect actual agent progress
   - Can't show which governorate is being worked

### Medium Blockers (SHOULD FIX)
1. **No agent failure recovery**
   - If an agent errors, work is lost
   - No retry queue
   - No dead-letter handling

2. **No agent coordination**
   - No locking mechanism for governorate (prevent 2 agents)
   - No work-stealing from idle agents
   - No priority queue

3. **No metrics/observability**
   - No throughput tracking per agent
   - No error rate monitoring
   - No completion time estimation

### Minor Blockers (NICE TO HAVE)
1. Agent warm-up/initialization
2. Batch size auto-tuning
3. Duplicate detection across batches
4. Performance optimization

---

## PART 3: WHAT CAN BE REUSED

### From GENERAL-SCRA-ER (Strong Reuse)
```
✅ Phone normalization (phonenumbers library)
✅ Website URL cleaning (lowercase, trailing slash removal)
✅ Address normalization (diacritics, trimming)
✅ Completeness scoring logic (fields present, data quality)
✅ Dedupe key generation (name + phone fingerprint)
✅ Validation rules (E.164, email regex, coordinate bounds)
✅ Category/subcategory mapping
✅ Review queue logic (match scoring, conflict detection)
```

### NOT Reusing (Different Architecture)
```
❌ Desktop Python GUI (18-AGENTS is web-based)
❌ Thread-based scraper (using Vercel Functions + async)
❌ Local file import (using Supabase API)
❌ CustomTkinter UI (using React + Tailwind)
```

**Reuse Strategy:** Copy validation/normalization **logic** (not code). Adapt to TypeScript/Node.js.

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Agent Infrastructure (Week 1)
```sql
-- Create agent_states table
-- Create agent_jobs table (extend job_queue)
-- Create agent_logs table (wire to schema)
-- Add views for agent metrics
```

**Frontend Impact:** Dashboard now reads from real tables

### Phase 2: Agent Orchestration (Week 2)
```typescript
// Implement AgentManager class
// Implement JobQueue with agent assignment
// Implement agent state machine (idle → running → paused)
// Implement graceful shutdown/reconnect
```

**Frontend Impact:** Dashboard shows real agent status

### Phase 3: Persistence & Recovery (Week 3)
```typescript
// Implement checkpoint system
// Implement session recovery
// Implement progress save intervals
// Implement crash detection
```

**Frontend Impact:** Browser close no longer loses progress

### Phase 4: Dashboard Integration (Week 4)
```typescript
// Connect dashboard to real Supabase data
// Implement real-time log streaming
// Implement agent detail view
// Implement agent history/stats
```

**Frontend Impact:** UI shows truthful runtime state

---

## PART 5: ESTIMATED COMPLETION PERCENTAGE

```
Database Schema:        95% done (just add agent tables)
API / Backend:          60% done (need agent orchestration)
Job Queue:              70% done (need assignment logic)
Frontend Dashboard:     40% done (needs Supabase wiring)
Persistence:            10% done (not yet implemented)
Agent Logs:             0% done (schema exists, not wired)
Observability:          0% done (no metrics yet)
────────────────────────────
OVERALL:                50% done
```

---

## PART 6: SAFETY ASSESSMENT

### Browser Close Risk
**Current:** 🔴 CRITICAL
- All state in Zustand (memory)
- Agent progress lost
- Queue persistence OK but UI unaware

**After Fix:** 🟢 SAFE
- Agent state in Supabase
- Resume from checkpoint
- UI hydrates from DB on reconnect

### Data Loss Risk
**Current:** 🟡 MEDIUM
- Queue persisted but jobs not assigned
- Scrape results might be duplicated
- No idempotency guarantees

**After Fix:** 🟢 LOW
- Agent owns job atomically
- Dedup prevents duplicates
- Idempotent operations with transaction support

### Agent Crash Risk
**Current:** 🔴 CRITICAL
- No error recovery
- No dead-letter queue
- Restart loses context

**After Fix:** 🟢 SAFE
- State saved to DB
- Auto-retry with exponential backoff
- Graceful failure handling

---

## PART 7: TRUTHFULNESS VERIFICATION

### What is Truly Real?
```
✅ "444 businesses in production table"
✅ "3-layer pipeline exists"
✅ "Jobs can be queued"
✅ "Dedup keys work"
✅ "Matching engine logic exists"
✅ "Supabase schema is solid"
✅ "Backend API is functional"

❌ "18 agents are running"
❌ "Agent state is persistent"
❌ "Dashboard reflects real progress"
❌ "System can resume after browser close"
❌ "Agents coordinate automatically"
```

### What Needs to Become Real?
1. Agent instantiation (not simulation)
2. Agent state tracking (not in-memory)
3. Agent-to-job ownership (not generic queue)
4. Dashboard data binding (not mock stats)
5. Resume capability (not fresh start)

---

## PART 8: ARCHITECTURE CLARIFICATION

### Current Architecture (Conceptual)
```
Browser (React)
    ↓
Zustand Stores (EPHEMERAL - lost on refresh!)
    ↓
API Calls to Vercel Functions
    ↓
Supabase (PERSISTENT)

Problem: Browser is single point of failure for state
```

### Target Architecture (Real)
```
Browser (React)
    ↓ (Load on mount)
Supabase (PERSISTENT - source of truth)
    ↓ (Hydrate)
Zustand Stores (CACHE - derived from DB)
    ↓
Display UI with real stats
    ↓
User controls agents via API
    ↓
API updates Supabase atomically
    ↓ (Event notification)
Browser re-syncs on next query
    ↓ (Browser close ≠ data loss)
Resume session from checkpoint
```

**Key Change:** Supabase is source of truth, not UI memory.

---

## PART 9: NEXT STEPS (SURGICAL EXECUTION)

### Recommended Execution Path

**DO THIS FIRST (Blocking):**
1. Create `agent_states` table (Supabase)
2. Create agent-aware `job_queue` v2 (with agent_id FK)
3. Implement `AgentManager` class (Node.js)
4. Wire dashboard to read real Supabase data

**THEN DO (Stability):**
1. Implement checkpoint/recovery system
2. Add graceful shutdown handling
3. Wire agent logs to dashboard
4. Add error retry logic

**THEN DO (Polish):**
1. Add observability metrics
2. Optimize agent assignments
3. Add UI visualizations
4. Performance tune

---

## PART 10: CLAUDE CODE READY PROMPT

[SEE PART 11 BELOW - SURGICAL IMPLEMENTATION PROMPT]

---

## PART 11: SURGICAL IMPLEMENTATION PROMPT FOR CLAUDE CODE

**COPY THIS ENTIRE SECTION AND PASTE INTO CLAUDE CODE:**

```
================================================================================
PROJECT GOAL
================================================================================
Transform the Iraq data collection system from a simulated multi-agent dashboard
(with ephemeral state) into a REAL, DURABLE, SUPABASE-BACKED multi-agent
orchestration system.

CURRENT STATE:
- Database schema: 95% done (3-layer pipeline solid)
- Backend API: 60% done (jobs exist but no agent ownership)
- Frontend: 40% done (dashboard visualizes mocks, not real state)
- Persistence: 10% done (queue OK, but agent state missing)
- Recovery: 0% done (browser close = complete loss of progress)

GOAL STATE:
- 18 agents truly running (one per Iraqi governorate)
- Agent state persisted to Supabase (atomic, recoverable)
- Dashboard shows truthful runtime state (not mocks)
- Browser close does NOT lose progress (resume from checkpoint)
- System is simpler and clearer (one source of truth: Supabase)

PHASE 1 GOAL: Make agent state REAL and PERSISTENT
- Create agent_states table in Supabase
- Create agent-aware job queue
- Implement AgentManager orchestration
- Wire dashboard to real data
- Test recovery after browser close/reconnect

TIMELINE: 3-5 days for Phase 1, can run in parallel with design work

================================================================================
PHASE 1: AGENT STATE & ORCHESTRATION (CRITICAL)
================================================================================

TASK 1.1: CREATE AGENT STATE INFRASTRUCTURE IN SUPABASE
─────────────────────────────────────────────────────────

Run this SQL migration (via Supabase SQL Editor):

```sql
-- Agent state management
CREATE TABLE IF NOT EXISTS agent_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_number INT NOT NULL UNIQUE CHECK (agent_number >= 1 AND agent_number <= 18),
    governorate_name TEXT NOT NULL,
    -- Governorate we're responsible for
    state TEXT NOT NULL CHECK (state IN ('idle', 'running', 'paused', 'error', 'completed')) DEFAULT 'idle',
    current_job_id UUID REFERENCES job_queue(id),
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    error_stack TEXT,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    -- For monitoring browser disconnect
    session_id TEXT,
    -- Browser session identifier
    checkpoint_data JSONB,
    -- Last known progress (governorate, category, batch number, etc)
    stats_total_scraped INT DEFAULT 0,
    stats_validated INT DEFAULT 0,
    stats_needs_review INT DEFAULT 0,
    stats_errors INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_governorate ON agent_states(governorate_name);
CREATE INDEX IF NOT EXISTS idx_agent_state ON agent_states(state);
CREATE INDEX IF NOT EXISTS idx_agent_job ON agent_states(current_job_id);
CREATE INDEX IF NOT EXISTS idx_agent_heartbeat ON agent_states(last_heartbeat DESC);

ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all agents" ON agent_states;
CREATE POLICY "Allow all agents" ON agent_states FOR ALL USING (true) WITH CHECK (true);

-- Agent logs
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agent_states(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_queue(id),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    context JSONB,
    -- Additional structured data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_agent ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_logs_job ON agent_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON agent_logs(created_at DESC);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all logs" ON agent_logs;
CREATE POLICY "Allow all logs" ON agent_logs FOR ALL USING (true) WITH CHECK (true);

-- Seed 18 agents (one per governorate)
INSERT INTO agent_states (agent_number, governorate_name, state)
VALUES
    (1, 'Baghdad', 'idle'),
    (2, 'Basra', 'idle'),
    (3, 'Erbil', 'idle'),
    (4, 'Sulaymaniyah', 'idle'),
    (5, 'Dohuk', 'idle'),
    (6, 'Nineveh', 'idle'),
    (7, 'Al Anbar', 'idle'),
    (8, 'Babil', 'idle'),
    (9, 'Karbala', 'idle'),
    (10, 'Najaf', 'idle'),
    (11, 'Al-Qādisiyyah', 'idle'),
    (12, 'Wasit', 'idle'),
    (13, 'Maysan', 'idle'),
    (14, 'Dhi Qar', 'idle'),
    (15, 'Al Muthanna', 'idle'),
    (16, 'Diyala', 'idle'),
    (17, 'Kirkuk', 'idle'),
    (18, 'Salah al-Din', 'idle')
ON CONFLICT (agent_number) DO NOTHING;
```

Success Criteria:
- ✅ agent_states table created with 18 rows (one per governorate)
- ✅ agent_logs table created
- ✅ Indexes built
- ✅ RLS policies applied
- ✅ All agents in 'idle' state

TASK 1.2: UPDATE JOB QUEUE FOR AGENT ASSIGNMENT
─────────────────────────────────────────────────

Current: job_queue has no agent owner
Target: job_queue tracks which agent it belongs to

Run this migration:

```sql
-- Add agent_id foreign key to job_queue
ALTER TABLE job_queue ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_states(id);
CREATE INDEX IF NOT EXISTS idx_queue_agent ON job_queue(agent_id);

-- View: Jobs assigned to each agent
CREATE OR REPLACE VIEW agent_queue_view AS
SELECT
    a.id,
    a.agent_number,
    a.governorate_name,
    a.state AS agent_state,
    COUNT(j.id) AS queued_jobs,
    COALESCE(a.current_job_id, 'idle'::uuid) AS current_job,
    a.stats_total_scraped,
    a.stats_validated,
    a.stats_needs_review,
    a.stats_errors
FROM agent_states a
LEFT JOIN job_queue j ON j.agent_id = a.id AND j.status IN ('pending', 'running')
GROUP BY a.id, a.agent_number, a.governorate_name, a.state, a.current_job_id, a.stats_total_scraped, a.stats_validated, a.stats_needs_review, a.stats_errors;
```

Success Criteria:
- ✅ job_queue.agent_id column added
- ✅ Index created
- ✅ agent_queue_view created
- ✅ Can query "which jobs does Agent 1 have?"

TASK 1.3: IMPLEMENT AGENT MANAGER (Node.js / TypeScript)
──────────────────────────────────────────────────────────

Create: `/web/src/lib/agent-manager.ts`

Purpose: Central orchestration for all 18 agents

Requirements:
1. Load agent states from Supabase on startup
2. Provide method: assignJobToAgent(agentId, jobData) → idempotent
3. Provide method: claimNextJob(agentId) → fetch unassigned job for this agent
4. Provide method: reportProgress(agentId, stats) → update agent_states stats
5. Provide method: reportError(agentId, error) → set agent to 'error' state
6. Provide method: heartbeat(agentId) → update last_heartbeat timestamp
7. Provide method: saveCheckpoint(agentId, data) → save progress to checkpoint_data
8. Provide method: resumeFromCheckpoint(agentId) → get last checkpoint
9. Initialize all 18 agents on startup
10. Handle agent timeout (if heartbeat > 5 min old, mark agent 'idle')

Implementation Approach:
- Load all agents into memory on API server startup
- Agent states are SOURCE OF TRUTH in Supabase
- Memory copy is just for fast lookup
- Every state change writes to Supabase immediately
- Frontend queries Supabase directly for dashboard

Code Structure:
```typescript
export class AgentManager {
  private agents: Map<UUID, AgentState>;
  private supabase: SupabaseClient;

  async initialize(): Promise<void>
    // Load all 18 agents from Supabase, set state = 'idle'

  async assignJobToAgent(agentId: UUID, jobData: any): Promise<Job>
    // 1. Create job in job_queue with agent_id
    // 2. Update agent_states.current_job_id
    // 3. Set agent state to 'running'
    // 4. Log the assignment
    // 5. Return job object

  async claimNextJob(agentId: UUID): Promise<Job | null>
    // 1. Check if agent already has current_job_id
    //    If so, resume that job
    // 2. Otherwise, find next unassigned job for this governorate
    // 3. Assign it and return
    // 4. If no jobs, return null

  async reportProgress(agentId: UUID, stats: {
    total_scraped: number,
    validated: number,
    needs_review: number,
    errors: number
  }): Promise<void>
    // Update agent_states stats columns

  async reportError(agentId: UUID, error: string, stack?: string): Promise<void>
    // Set agent state to 'error'
    // Store error_message and error_stack
    // Log the error

  async heartbeat(agentId: UUID): Promise<void>
    // Update agent_states.last_heartbeat = NOW()
    // (called every N seconds by agent)

  async saveCheckpoint(agentId: UUID, checkpoint: any): Promise<void>
    // Update agent_states.checkpoint_data = checkpoint
    // checkpoint should contain: { governorate, category, batch_number, lastTimestamp }

  async resumeFromCheckpoint(agentId: UUID): Promise<any | null>
    // Return agent_states.checkpoint_data

  async detectTimeouts(): Promise<UUID[]>
    // Find agents where last_heartbeat > 5 minutes ago
    // Set their state to 'idle'
    // Return affected agent IDs
}

export const agentManager = new AgentManager(supabase);
```

Success Criteria:
- ✅ AgentManager class compiles without errors
- ✅ initialize() loads all 18 agents
- ✅ assignJobToAgent() creates atomic transaction
- ✅ heartbeat() updates timestamp
- ✅ saveCheckpoint() persists progress
- ✅ All methods are idempotent (safe to retry)
- ✅ Error handling is graceful

TASK 1.4: UPDATE API ENDPOINTS FOR AGENT AWARENESS
────────────────────────────────────────────────────

Update: `/web/api/pipeline.ts`

Changes:
1. POST /api/pipeline/run → NEW behavior:
   - Extract governorate from request
   - Find Agent N responsible for that governorate
   - Assign job to Agent N
   - Return job + agent ID

2. GET /api/pipeline/status → Keep as-is (job tracking)

3. NEW: POST /api/agents/{agentId}/claim-job
   - Agent calls this to get its next job
   - Returns job details + checkpoint if resuming
   - Atomically updates agent_states.current_job_id

4. NEW: POST /api/agents/{agentId}/heartbeat
   - Agent calls every 30 seconds
   - Updates last_heartbeat

5. NEW: POST /api/agents/{agentId}/progress
   - Agent reports progress (scraped, validated, errors)
   - Updates agent_states stats

6. NEW: POST /api/agents/{agentId}/checkpoint
   - Agent saves progress
   - Allows resume after disconnect

7. NEW: POST /api/agents/{agentId}/error
   - Agent reports failure
   - Sets agent state to 'error'

8. NEW: GET /api/agents (Dashboard query)
   - Returns all agent states + stats
   - Pulls from agent_queue_view
   - Minimal latency

Success Criteria:
- ✅ New endpoints compile
- ✅ POST /api/agents/{id}/claim-job returns job with agent assignment
- ✅ GET /api/agents returns real agent states (not mocks)
- ✅ All endpoints update Supabase atomically
- ✅ Error handling for agent not found, job not found

TASK 1.5: WIRE DASHBOARD TO REAL DATA
──────────────────────────────────────

Update: `/web/src/pages/Dashboard.tsx`

Changes:
1. Replace Zustand stores with Supabase queries:
   - Remove: `const { results } = useScraperStore();`
   - Add: `useQuery(['agents'], () => fetch('/api/agents').then(r => r.json()))`

2. Update stat card values:
   - Total Scraped = SUM(agent.stats_total_scraped) from all agents
   - Staged = COUNT(*) from businesses_staging
   - Validated = COUNT(*) from businesses_staging WHERE match_status = 'validated'
   - Needs Review = COUNT(*) from businesses_staging WHERE match_status = 'review'

3. Create Agent Matrix visualization:
   - 18 rows (one per agent)
   - Columns: Agent #, Governorate, State, Current Job, Scraped, Validated, Errors
   - Color code by state (idle=gray, running=blue, error=red, completed=green)

4. Create Active Runs table:
   - Show agents currently in 'running' state
   - Show job ID, progress, elapsed time

5. Create Live Logs panel:
   - Query agent_logs ordered by created_at DESC
   - Filter by agent ID (if selected)
   - Auto-refresh every 2 seconds

Success Criteria:
- ✅ Dashboard queries /api/agents successfully
- ✅ Stat cards show real numbers from Supabase
- ✅ Agent matrix renders 18 rows
- ✅ Log panel shows agent_logs in real-time
- ✅ Page refreshes and stats persist (no loss on reload)

TASK 1.6: TEST RECOVERY SCENARIO
──────────────────────────────────

Test Plan:
1. Start Agent 1 (Baghdad) scraping
2. Agent 1 processes 50 records, saves checkpoint
3. Refresh browser (simulating crash)
4. Agent 1 resumes from checkpoint
5. Verify progress continues, no data loss

Steps:
1. Open Dashboard
2. Click "Start Agent 1" button (Baghdad)
3. Agent starts collecting, reports progress every 10 records
4. Hard refresh browser (Ctrl+Shift+R)
5. Dashboard reloads, shows Agent 1 status
6. Agent resumes from last checkpoint (should say something like "Resuming from record 50 of 300...")
7. Verify: no duplicate records, progress continues

Success Criteria:
- ✅ Agent state persists after browser refresh
- ✅ Agent resumes from checkpoint (not restart from 0)
- ✅ No duplicate records in staging table
- ✅ Progress stat shows correct resume point

TASK 1.7: MEASURE AND VALIDATE
─────────────────────────────────

Verification Checklist:
- [ ] SELECT COUNT(*) FROM agent_states WHERE state = 'idle'; → 18
- [ ] SELECT COUNT(*) FROM agent_logs; → > 0 (logs are being created)
- [ ] Navigate to Dashboard → Agent matrix renders
- [ ] Agent matrix shows real governorate names
- [ ] Start one agent → state changes from 'idle' to 'running'
- [ ] Agent creates job in job_queue with agent_id
- [ ] Check agent_logs table → see agent activity logs
- [ ] Refresh browser → agent state persists
- [ ] Agent that was running → resumes work, checkpoint data intact

================================================================================
IMPLEMENTATION CONSTRAINTS
================================================================================

MUST KEEP:
✅ Supabase as sole database (no Firebase)
✅ 3-layer pipeline (import_raw → staging → production)
✅ Existing validation logic (phone, email, address)
✅ Existing API endpoints (don't break backward compat)
✅ Existing database schema (add tables, don't modify core)

MUST NOT:
❌ Feed public 'belive' app yet (this is staging/collection only)
❌ Mix in Firebase or other auth
❌ Create mock agents (must be real)
❌ Use client-side state as source of truth
❌ Add dependencies that require new infrastructure
❌ Break existing business data import flow

DEPLOYMENT:
- Deploy to Vercel (existing setup)
- Run SQL migrations via Supabase dashboard
- Environment variables: already set (SUPABASE_URL, SERVICE_ROLE_KEY)
- No new secrets needed

================================================================================
SUCCESS CRITERIA FOR PHASE 1
================================================================================

Agent Infrastructure:
- ✅ 18 agents seeded in agent_states table
- ✅ Each agent has unique governorate_name
- ✅ Each agent state is persisted and recoverable
- ✅ Dashboard shows real agent states (not mocks)

Orchestration:
- ✅ Jobs can be assigned to specific agents
- ✅ Agents can claim and resume jobs
- ✅ Progress is checkpointed and resumable
- ✅ Browser close does not lose agent state or progress

Data Pipeline:
- ✅ Jobs flow into businesses_staging correctly
- ✅ Dedup and matching work as expected
- ✅ No data corruption or duplication
- ✅ All existing validation logic still works

Observability:
- ✅ Agent logs are recorded in agent_logs table
- ✅ Dashboard displays agent logs in real-time
- ✅ Agent matrix shows accurate stats
- ✅ System is auditable (can trace what each agent did)

Crash Safety:
- ✅ Browser close does not cause data loss
- ✅ Agent can resume from checkpoint
- ✅ Jobs are not re-processed (idempotent)
- ✅ Errors are logged and agent pauses gracefully

================================================================================
DELIVERABLES (at end of Phase 1)
================================================================================

1. SQL migrations (run via Supabase dashboard)
   → agent_states table
   → agent_logs table
   → agent_queue_view
   → 18 agents seeded

2. Updated API endpoints in `/web/api/pipeline.ts`
   → POST /api/agents/{id}/claim-job
   → POST /api/agents/{id}/heartbeat
   → POST /api/agents/{id}/progress
   → POST /api/agents/{id}/checkpoint
   → POST /api/agents/{id}/error
   → GET /api/agents

3. New module: `/web/src/lib/agent-manager.ts`
   → AgentManager class
   → Full orchestration logic
   → Supabase integration

4. Updated Dashboard: `/web/src/pages/Dashboard.tsx`
   → Agent matrix (18 rows)
   → Real-time log view
   → Stat cards from Supabase
   → Live agent status

5. Test results
   → Recovery scenario verified
   → All 18 agents initialize
   → Progress saves and resumes
   → No data loss on browser close

================================================================================
EXECUTION NOTES
================================================================================

This is intentionally INCREMENTAL:
- Phase 1 makes agent state REAL (weeks 1-2)
- Phase 2 will add resilience/monitoring (weeks 3-4)
- Phase 3 will optimize performance (weeks 5-6)

This approach:
✅ Gets to "working agents" quickly
✅ Avoids over-engineering initially
✅ Keeps code simple and understandable
✅ Allows for testing with real data early
✅ Preserves existing pipeline logic

Do NOT wait for perfection. Get the 18 agents running with real state first.
Then iterate on resilience, observability, and performance.

================================================================================
```

---

## SUMMARY

| Aspect | Current | Target | Effort |
|--------|---------|--------|--------|
| **Agent State** | In-memory Zustand | Supabase (persistent) | 2-3 days |
| **Job Assignment** | Generic queue | Agent-owned jobs | 1-2 days |
| **Dashboard Data** | Mocks | Real Supabase | 1-2 days |
| **Recovery** | None (data loss) | Checkpoint system | 2-3 days |
| **Total Phase 1** | — | **Real agents** | **5-7 days** |

### Reality Check ✅
- ✅ Database schema is solid (95% done)
- ✅ Backend API exists (60% done)
- ✅ Frontend framework ready (React + Vercel)
- ✅ No Firebase mixing
- ✅ 444 business staging data ready
- ❌ Agents not yet real (this fixes it)
- ❌ State not persistent (this fixes it)
- ❌ Dashboard shows mocks (this fixes it)

### Risk Assessment
**Before Fix:** 🔴 CRITICAL
- Browser close = total progress loss
- Agents are simulation, not real
- No recovery possible

**After Fix:** 🟢 SAFE
- Agent state in Supabase
- Resume from checkpoint
- Real agents with persistent state

---

**Ready to begin Phase 1. Copy the prompt above into Claude Code.**

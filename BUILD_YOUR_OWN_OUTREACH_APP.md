# 🛠️ BUILD YOUR OWN BULK MESSAGING APP

**Goal:** Create a custom bulk messaging system integrated into your HUMUS app
**Complexity:** Medium
**Time:** 2-4 weeks (if you code)
**Cost:** $100-500 initial + $20-50/month hosting

---

## Why Build Your Own?

| Advantage | Benefit |
|-----------|---------|
| **No Platform Markups** | Save 20-25% on WhatsApp API costs |
| **Full Control** | Customize exactly how you want |
| **Owned Asset** | Reuse for all future campaigns |
| **Integration** | Use existing user data directly |
| **Branding** | Your logo, your messaging |
| **Scalability** | Grow without platform limits |

**Break-even:** ~10 campaigns (~$200-500 in savings vs platforms)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR HUMUS APP                           │
│  (React Frontend - already you have this!)                  │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ 1. Select contacts to message
      │ 2. Write message template
      │ 3. Schedule send time
      │
┌─────v───────────────────────────────────────────────────────┐
│            BACKEND API (Node.js / Python)                   │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  Message     │      │  Contact     │                    │
│  │  Queue       │◄────►│  Management  │                    │
│  │  (BullMQ)    │      │  (Database)  │                    │
│  └──────┬───────┘      └──────────────┘                    │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  Message     │      │  Rate        │                    │
│  │  Template    │      │  Limiter     │                    │
│  │  Engine      │      │  (10-20/sec) │                    │
│  └──────┬───────┘      └──────────────┘                    │
│         │                                                   │
└─────────┼─────────────────────────────────────────────────┘
          │
          │ 4. Respect rate limits
          │ 5. Handle failures
          │ 6. Track status
          │
┌─────────v────────────────────────────────────────────────────┐
│         WHATSAPP BUSINESS API (Meta)                         │
│  - Direct integration (no middleman)                         │
│  - Lowest cost ($0.02-0.10/msg)                            │
│  - Official delivery guarantees                             │
└──────────────────────────────────────────────────────────────┘
          │
          ▼ Messages delivered
┌──────────────────────────────────┐
│   Iraqi Businesses (SMS/WhatsApp) │
│   - Abu Ali Restaurant           │
│   - Coffee House                 │
│   - Clinic Dr. Fatima            │
│   ... 441 more businesses         │
└──────────────────────────────────┘
```

---

## Technology Stack

### Frontend (You Already Have This!)
```
Framework: React 18
Language: TypeScript
Build: Vite
Styling: Tailwind CSS
State: Zustand or React Query
```

### Backend (Build This)
```
Language: Node.js (TypeScript) or Python
Framework: Express.js or FastAPI
Database: PostgreSQL (use existing Supabase!)
Job Queue: BullMQ (Node) or Celery (Python)
Cache: Redis
API Client: twilio/whatsapp-sdk
```

### Infrastructure
```
Hosting: Vercel (functions) or Railway
Database: Supabase (already have it!)
Message Queue: Redis (free tier available)
Monitoring: Sentry (error tracking)
```

---

## Step-by-Step Implementation

### Phase 1: Setup (2-3 days)

#### 1A: Create Backend Structure
```bash
# Create new project
mkdir humus-outreach-backend
cd humus-outreach-backend

# Initialize Node.js project
npm init -y
npm install express typescript @types/express dotenv

# Create folder structure
mkdir src/{controllers,services,routes,models,utils}
touch src/index.ts
```

#### 1B: Setup WhatsApp Business API

**Requirements:**
1. Meta Business Account (free)
2. WhatsApp Business Account (free, linked to your phone number)
3. Get API credentials (phone_id, business_account_id, access_token)

**Steps:**
```
1. Go to: https://developers.facebook.com/
2. Create app → Type: Business
3. Add WhatsApp product
4. Complete verification (takes 1-2 days)
5. Get permanent access token
6. Copy: phone_number_id, business_account_id
```

#### 1C: Setup Database Tables
```sql
-- Add to your Supabase

CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  template_vars JSONB, -- {name, category, etc}
  scheduled_at TIMESTAMP,
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, completed
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  created_by TEXT -- user_id
);

CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES outreach_campaigns(id),
  business_id BIGINT REFERENCES businesses(id),
  phone_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed, read, replied
  whatsapp_message_id TEXT, -- from WhatsApp API
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  reply_text TEXT,
  replied_at TIMESTAMP
);

CREATE TABLE outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- message with {VARIABLES}
  variables JSONB, -- {name, category, city, phone}
  created_at TIMESTAMP DEFAULT now()
);
```

---

### Phase 2: Core API Implementation (5-7 days)

#### 2A: WhatsApp Service
```typescript
// src/services/whatsappService.ts

import axios from 'axios';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'image' | 'document';
  content: string;
  mediaUrl?: string;
}

class WhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion = 'v20.0';
  private baseUrl = 'https://graph.instagram.com';

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_ID!;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  }

  async sendMessage(message: WhatsAppMessage): Promise<{
    messageId: string;
    status: 'sent' | 'failed';
    error?: string;
  }> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: message.to.replace(/\D/g, ''), // Remove non-digits
        type: message.type,
        [message.type === 'text' ? 'text' : 'image']: {
          body: message.content,
          ...(message.mediaUrl && { link: message.mediaUrl }),
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        messageId: response.data.messages[0].id,
        status: 'sent',
      };
    } catch (error) {
      return {
        messageId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMessageStatus(messageId: string): Promise<string> {
    // Implement webhook handling instead
    // WhatsApp sends status updates via webhook
    return 'pending';
  }
}

export default new WhatsAppService();
```

#### 2B: Message Queue Service
```typescript
// src/services/queueService.ts

import Queue from 'bull';
import redis from 'redis';
import whatsappService from './whatsappService';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

interface MessageJob {
  campaignId: string;
  businessId: string;
  phoneNumber: string;
  messageText: string;
  templateVars?: Record<string, string>;
}

class QueueService {
  private messageQueue: Queue.Queue<MessageJob>;

  constructor() {
    this.messageQueue = new Queue('messages', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    // Process queue with rate limiting (20 messages/second)
    this.messageQueue.process(20, async (job) => {
      return await this.processMessage(job);
    });
  }

  async addMessages(messages: MessageJob[]): Promise<void> {
    for (const message of messages) {
      await this.messageQueue.add(message, {
        // Prevent duplicate processing
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3, // Retry 3 times if fails
        backoff: {
          type: 'exponential',
          delay: 2000, // 2 second initial delay
        },
      });
    }
  }

  private async processMessage(job: Queue.Job<MessageJob>) {
    const { campaignId, businessId, phoneNumber, messageText } = job.data;

    try {
      // Send via WhatsApp
      const result = await whatsappService.sendMessage({
        to: phoneNumber,
        type: 'text',
        content: messageText,
      });

      if (result.status === 'sent') {
        // Update database
        await updateMessageStatus(
          campaignId,
          businessId,
          'sent',
          result.messageId
        );
        return { success: true, messageId: result.messageId };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      // Failed - will retry
      throw error;
    }
  }
}

export default new QueueService();
```

#### 2C: Campaign Controller
```typescript
// src/controllers/campaignController.ts

import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import queueService from '../services/queueService';

export async function createCampaign(req: Request, res: Response) {
  const { name, message, templateVars, scheduledAt } = req.body;

  try {
    const { data: campaign, error } = await supabase
      .from('outreach_campaigns')
      .insert({
        name,
        message,
        template_vars: templateVars,
        scheduled_at: scheduledAt || new Date(),
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function sendCampaign(req: Request, res: Response) {
  const { campaignId, businessIds } = req.body;

  try {
    // Get campaign details
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get businesses to message
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, phone, category, city')
      .in('id', businessIds || []) // If no IDs, use all
      .eq('is_published', true)
      .not('phone', 'is', null);

    // Prepare messages with template variables
    const messages = businesses!.map((business) => {
      const messageText = campaign.message
        .replace('[NAME]', business.name)
        .replace('[CATEGORY]', business.category)
        .replace('[CITY]', business.city || 'Iraq');

      return {
        campaignId,
        businessId: business.id,
        phoneNumber: business.phone,
        messageText,
      };
    });

    // Add to queue
    await queueService.addMessages(messages);

    // Update campaign status
    await supabase
      .from('outreach_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    res.json({
      success: true,
      message: `Campaign queued for ${messages.length} messages`,
      campaignId,
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function getCampaignStatus(req: Request, res: Response) {
  const { campaignId } = req.params;

  try {
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    const { data: messages } = await supabase
      .from('outreach_messages')
      .select('status')
      .eq('campaign_id', campaignId);

    const stats = {
      total: messages?.length || 0,
      sent: messages?.filter(m => m.status === 'sent').length || 0,
      delivered: messages?.filter(m => m.status === 'delivered').length || 0,
      failed: messages?.filter(m => m.status === 'failed').length || 0,
      replied: messages?.filter(m => m.status === 'replied').length || 0,
    };

    res.json({ campaign, stats });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
```

---

### Phase 3: Frontend Integration (3-5 days)

#### 3A: Campaign Creation Page
```typescript
// src/pages/Outreach.tsx

import { useState } from 'react';
import { toast } from 'sonner';

export function Outreach() {
  const [campaignName, setCampaignName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [selectedBusinesses, setSelectedBusinesses] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCampaign = async () => {
    if (!campaignName || !messageTemplate) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          message: messageTemplate,
          templateVars: { name: '[NAME]', category: '[CATEGORY]', city: '[CITY]' },
        }),
      });

      const { campaign } = await response.json();
      toast.success(`Campaign "${campaign.name}" created!`);
      setCampaignName('');
      setMessageTemplate('');
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          businessIds: selectedBusinesses || null, // null = all
        }),
      });

      const { message } = await response.json();
      toast.success(message);
    } catch (error) {
      toast.error('Failed to send campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Bulk Outreach</h1>

        {/* Campaign Creator */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Welcome to HUMUS"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message Template</label>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Hi [NAME], your [CATEGORY] business is featured on HUMUS..."
              rows={5}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Available variables: [NAME], [CATEGORY], [CITY], [PHONE]
            </p>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>

        {/* Saved Campaigns */}
        <div className="mt-6 space-y-3">
          {/* List campaigns from API */}
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 4: Webhooks & Status Tracking (2-3 days)

#### 4A: WhatsApp Webhook Handler
```typescript
// src/routes/webhooks.ts

import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Webhook verification (WhatsApp requires this)
router.get('/webhooks/whatsapp', (req: Request, res: Response) => {
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Webhook receiver (WhatsApp sends status updates here)
router.post('/webhooks/whatsapp', async (req: Request, res: Response) => {
  const { entry } = req.body;

  try {
    for (const e of entry) {
      for (const change of e.changes) {
        const { value } = change;

        // Handle message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await updateMessageStatus(status);
          }
        }

        // Handle incoming replies
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(message);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function updateMessageStatus(status: any) {
  const { id, status: msgStatus, timestamp } = status;

  await supabase
    .from('outreach_messages')
    .update({
      status: msgStatus, // sent, delivered, read, failed
      delivered_at: msgStatus === 'delivered' ? new Date().toISOString() : null,
    })
    .eq('whatsapp_message_id', id);
}

async function handleIncomingMessage(message: any) {
  const { from, text, timestamp } = message;

  await supabase
    .from('outreach_messages')
    .update({
      status: 'replied',
      reply_text: text.body,
      replied_at: new Date(parseInt(timestamp) * 1000).toISOString(),
    })
    .eq('phone_number', from);
}

export default router;
```

---

## Deployment Guide

### Option A: Deploy to Vercel (Easiest)

```bash
# 1. Create vercel.json
cat > vercel.json << EOF
{
  "env": {
    "WHATSAPP_PHONE_ID": "@whatsapp_phone_id",
    "WHATSAPP_ACCESS_TOKEN": "@whatsapp_access_token",
    "WHATSAPP_VERIFY_TOKEN": "@whatsapp_verify_token",
    "REDIS_URL": "@redis_url"
  }
}
EOF

# 2. Deploy
vercel --prod
```

### Option B: Deploy to Railway (Full Control)

```bash
# 1. Connect git repo to Railway
# 2. Set environment variables in Railway dashboard
# 3. Railway auto-deploys on git push
```

### Option C: Deploy to Docker (Self-hosted)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## Testing Checklist

```
☐ WhatsApp API connection works
☐ Can send single message successfully
☐ Can send 10 messages in bulk
☐ Queue respects rate limits (10-20/sec)
☐ Webhook receives status updates
☐ Replies are captured
☐ Database tracks all messages
☐ UI shows campaign progress
☐ Error handling works
☐ Retry logic kicks in for failures
```

---

## Cost Breakdown

```
Initial Setup:
- Development time: 20-40 hours × $25-50/hr = $500-2000

Monthly Costs:
- Vercel/Railway hosting: $20-50/month
- Redis: $0 (free tier) or $50+ (managed)
- WhatsApp API: $0.02-0.10 per message
  For 444 messages = $11-44
  For 10 campaigns/month = $110-440

Total Monthly: $130-490
Breakeven vs platforms: ~10-15 campaigns
```

---

## Next Steps

1. **Week 1:** Setup backend & database
2. **Week 2:** Implement WhatsApp service & queue
3. **Week 3:** Build frontend UI
4. **Week 4:** Test & deploy

Then you own a reusable outreach platform!

---

**Questions? Ready to build?** Let me know and I can help you set up the backend!

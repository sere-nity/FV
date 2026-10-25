# Shelf

**Turn your taste into personal picks for each fan.**

Shelf is a Fanvue app that lets creators curate items they genuinely recommend (songs, films, books, articles, places, quotes) and automatically matches them to fans based on their chat history. The AI explains each pick in the creator's voice, but **never invents endorsements** — it only recommends items the creator has put on their shelf.

## Product Reasoning

### The Problem
Creators want to share taste with fans but can't answer every DM asking for recommendations. Fans want suggestions that feel personal, not generic.

### The Solution
1. **Creator curates once**: Add items to a shelf with personal notes
2. **AI matches per fan**: Analyzes chat history to extract taste profile
3. **Personalized picks**: Top 3 items from the shelf with reasons grounded in what the fan said

### The One Rule
**Shelf only recommends items the creator has put on their shelf.** The AI matches and explains; it never invents endorsements. This preserves creator authenticity and trust.

### Why This Works
- **Scalable curation**: Creator effort is O(shelf items) not O(fans)
- **Authentic voice**: Recommendations always come from the creator's notes
- **Personal matching**: Each fan sees different picks based on their chat history
- **Safe AI**: Constrained to existing shelf items, not open-ended generation

## Implementation

### Architecture
- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4
- **Database**: SQLite via Prisma
- **AI**: xAI Grok (OpenAI-compatible API) for profile extraction + explanations
- **Scoring**: Pure code (deterministic, no LLM)
- **Auth**: Fanvue embedded SDK + dev bypass for testing

### Data Model (6 tables)
```
creator       → fanvueUserUuid, handle, displayName, voiceNotes
shelf_item    → type, source, url/quoteText, title, preview fields, creatorNote, tags
fan           → fanvueUserUuid, displayName
message       → sender, text, sentAt (mock Fanvue chat API shape)
taste_profile → summary, liked, wantsNext, wantedTypes, avoid (cached, auto-regenerates)
pick          → shelfItemId, reason, score, status (suggested/shown/opened)
```

### Recommendation Engine (`lib/recommend`)

**1. Profile Extraction** (`profile.ts`)
- Input: Chat messages from fan
- LLM: Grok structured output → summary, liked, wantsNext, wantedTypes, avoid
- Fallback: Deterministic keyword matching when `XAI_API_KEY` missing
- Cached in `taste_profile` table, regenerated after 24h or on webhook

**2. Scoring** (`score.ts`)
- Input: Profile + all shelf items + already-picked IDs
- Pure code scoring:
  - Base: 50 points
  - Type match: +20 if wanted type
  - Tag/mood match: +15 per match (max 30)
  - Note relevance: +10 if creator note mentions wants
  - Avoid penalty: -50 per avoid match
  - Already picked: -30
- **Guarantee**: Only shelf items scored (no off-shelf results possible)
- Output: Sorted by score, top N selected

**3. Explanation** (`explain.ts`)
- Input: Item + profile + fan name
- LLM: One-line reason connecting creator note to fan's words
- Fallback: Template-based when no LLM
- Max 140 characters, grounded in creator note (never rewrites it)

### Data Source Abstraction (`lib/data-source`)
- **MockSource**: Reads from SQLite (default for demo)
- **FanvueSource**: Placeholder for real Fanvue API (not yet available)
- Env var: `DATA_SOURCE=mock|fanvue`

### API Routes
- `GET /api/shelf` — List shelf items (filterable by type)
- `POST /api/shelf` — Create shelf item
- `DELETE /api/shelf` — Delete item
- `GET /api/fans` — List fans with message counts
- `GET /api/picks` — Generate picks (extracts profile, scores items, explains, saves)
- `PATCH /api/picks` — Update pick status (shown/opened)
- `POST /api/webhooks/fanvue` — Webhook stub (stretch, not implemented)
- `POST /api/dev/token` — Dev-only fake auth token generator

### Screens

**Creator**
1. `/creator` — My Shelf (cards, type filter, import placeholders)
2. `/creator/preview` — Fan Preview (select fan → profile + 3 picks with reasons) **← MOST IMPORTANT FOR REVIEW**

**Fan** (mobile-first)
3. `/fan` — Picks for You (top 3 with creator note + reason, Spotify embeds)
4. `/fan/shelf` — Full Shelf (browse all items, filterable)

**Dev**
5. `/dev` — Auth bypass (select fan or creator from seed data)

### Seed Data
- **1 creator**: Maya (London singer-songwriter)
- **30 shelf items**: Real links across all types (songs, films, books, articles, places, quotes) with hand-written notes
- **12 fans**: Sam, Priya, Leo, Jess, Alex, Maya K, Taylor, Chris, Emma, Jordan (with chat), Riley, Morgan (empty chat)
- **70+ messages**: In Fanvue chat API shape (sender, text, sentAt)

## How to Run Locally

### Prerequisites
- Node.js 18+
- pnpm
- xAI API key (optional, falls back to deterministic mode)

### Setup
```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local:
#   DATABASE_URL="file:./dev.db"
#   XAI_API_KEY=<your-key>  # Optional
#   DATA_SOURCE=mock         # Use mock data

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Build
pnpm build

# Start dev server
pnpm dev
```

### Testing the App
1. Open `http://localhost:3000/dev`
2. **For creator view**: Select "Maya (Creator)" → see shelf, then click "Preview Fan View"
3. **For fan view**: Select any fan (e.g. "Sam", "Priya", "Leo") → see personalized picks

### With xAI API Key
- Set `XAI_API_KEY` in `.env.local`
- Profile extraction and explanations use Grok
- Model: `grok-beta` (or `grok-4` when available)
- Base URL: `https://api.x.ai/v1`

### Without xAI API Key
- Leave `XAI_API_KEY` empty
- Deterministic fallback kicks in
- Profile extraction: keyword matching
- Explanations: template-based
- Scoring: unchanged (always deterministic)

### Running Tests
```bash
pnpm test
```

Tests verify:
- Scoring never returns off-shelf items ✓
- Avoid genre never returned in top picks ✓
- Empty profile fallback works ✓
- Type matching boosts correct items ✓
- Already-picked items penalized ✓
- Tag/mood matching works ✓

## Environment Variables

### Required
- `DATABASE_URL` — SQLite file path (e.g. `file:./dev.db`)

### Optional (for mock demo)
- `XAI_API_KEY` — xAI API key (deterministic fallback if missing)
- `DATA_SOURCE` — `mock` (default) or `fanvue`

### Required (for real Fanvue integration)
- `OAUTH_CLIENT_ID` — Fanvue app client ID
- `OAUTH_CLIENT_SECRET` — Fanvue app secret
- `OAUTH_REDIRECT_URI` — OAuth callback URL
- `SESSION_SECRET` — JWT signing secret
- `DATA_SOURCE=fanvue` — Use real Fanvue API

## What Was Cut / Deferred

### Cut for Scope
- **Add Item UI**: No creator form to add new items (only seed data)
- **Edit/Delete UI**: No creator item management (API routes exist)
- **Real imports**: Spotify, Letterboxd, Goodreads, Are.na placeholders only
- **Working webhook**: Stub exists but no profile invalidation on new message
- **Real Fanvue auth**: Dev bypass only (SDK integration ready, needs real tokens)
- **Embedding similarity**: Tags only (no vector search)

### Stretch Features (Spec Said "Only If Core Done")
- **Priced pick**: "Ask Maya for a personal pick" paid DM not implemented
- **DM card**: No automatic message with experience link
- **Real-time webhook**: Placeholder only, no live profile updates

### Deferred for Demo
- **Analytics**: No pick open rate tracking UI (data model supports it)
- **Multi-creator**: Schema supports it, UI hardcoded to seed creator
- **Spotify/YouTube oEmbed**: Spotify iframe works, YouTube not implemented
- **Link preview fetching**: Pre-fetched in seed JSON, no live OG scraping

## Project Structure
```
app/
  api/
    shelf/route.ts        — Shelf CRUD
    picks/route.ts        — Pick generation + status updates
    fans/route.ts         — List fans
    dev/token/route.ts    — Dev auth bypass
    webhooks/fanvue/      — Webhook stub
  creator/
    page.tsx              — My Shelf
    preview/page.tsx      — Fan Preview ⭐
  fan/
    page.tsx              — Picks for You
    shelf/page.tsx        — Full Shelf
  dev/page.tsx            — Dev auth UI
  
lib/
  data-source/
    types.ts              — DataSource interface
    mock.ts               — MockSource (SQLite)
    fanvue.ts             — FanvueSource (placeholder)
    index.ts              — Factory
  recommend/
    types.ts              — Recommendation types
    profile.ts            — Profile extraction (LLM + fallback)
    score.ts              — Scoring algorithm (pure code)
    explain.ts            — Explanation generation (LLM + fallback)
    index.ts              — Exports
    score.test.ts         — Unit tests ✓
  db.ts                   — Prisma client singleton
  auth.ts                 — Dev token parsing

prisma/
  schema.prisma           — 6-table data model
  seed.ts                 — Seed script

seed/
  data.json               — Maya + 30 items + 12 fans + messages

app-manifest.json         — Fanvue app manifest (embedded mode)
```

## Technical Choices

### Why SQLite?
- Spec required it
- Simple local dev, no Docker/Postgres needed
- Prisma makes it easy to migrate to Postgres later

### Why xAI Grok?
- User has xAI credits (spec requirement)
- OpenAI-compatible API (easy to swap)
- Structured output for profile extraction

### Why Deterministic Scoring?
- Predictable, testable, fast
- No LLM latency or cost for scoring
- Only uses LLM where human-like language needed (profile, explanations)

### Why Mock Data Source?
- Fanvue API doesn't expose chat history (yet)
- Allows demo without real Fanvue account
- Easy to swap when API available

### Why One Code Path for All Item Types?
- Spec requirement (keep it simple)
- Link or quote + note → unified model
- Type-specific rendering only in UI

## Known Limitations

1. **No real Fanvue auth**: Dev bypass only (SDK ready, needs real app registration)
2. **No live chat sync**: Messages are seed data (webhook placeholder exists)
3. **No vector embeddings**: Tag-based matching only (schema has embedding fields)
4. **Pre-fetched previews**: Link metadata in seed JSON, no live OG scraping
5. **Single creator**: UI hardcoded to Maya (data model supports multi-creator)
6. **No creator item management**: Add/edit/delete routes exist, no UI

## Future Improvements

### Near-term
1. Add creator item management UI (form + validation)
2. Implement real Fanvue auth flow (replace dev bypass)
3. Wire up webhook to invalidate profiles on new messages
4. Add vector embeddings for better similarity matching
5. Live link preview fetching (OG tags + oEmbed)

### Long-term
1. Multi-creator support in UI
2. Analytics dashboard (pick open rates, popular items)
3. Priced picks (DM paywall integration)
4. Real imports (Spotify, Letterboxd, etc. via OAuth)
5. Creator voice fine-tuning (per-creator LLM adaptation)

## Testing Checklist

- [x] Seed database with 30 items, 12 fans, 70+ messages
- [x] Creator shelf loads and filters by type
- [x] Creator preview generates profile for each fan
- [x] Creator preview shows 3 personalized picks with reasons
- [x] Fan picks page loads top 3 with creator notes
- [x] Fan picks show personalized reasons
- [x] Fan shelf browser shows all items, filterable
- [x] Dev auth works for all 12 fans + creator
- [x] Scoring never returns off-shelf items (unit test)
- [x] Avoid tags penalize correctly (unit test)
- [x] Empty profile fallback works (unit test)
- [x] App builds without errors
- [x] No TypeScript errors

## Demo Flow

**Recommended review path:**
1. Start at `/dev`
2. Select "Maya (Creator)" → see shelf with 30 items
3. Click "Preview Fan View"
4. Select "Sam" → see profile ("wants quiet music") + 3 picks (quiet songs + reasons)
5. Select "Leo" → see profile ("going through breakup") + 3 picks (emotional support items)
6. Go back to `/dev`, select "Sam" as fan
7. See top 3 picks with Maya's notes + personalized reasons
8. Click "Browse Full Shelf" → see all 30 items

## Credits

Built for Fanvue take-home by Serene (Oct 2026).

Seed data uses real links to existing music, films, books, and places. No fabricated endorsements or invented URLs.

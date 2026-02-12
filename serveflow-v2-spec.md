# ServeFlow v2 — Live Service Cue System

## What is this?

A live service run sheet tool for churches. The admin builds an ordered program
(Opening Prayer → Worship → Offering → Sermon → …), assigns each item a
department and a duration, then hits **Go Live**. A shared display screen
auto-advances through the program so every department knows exactly when
they're up — no walkie-talkies, no paper, no running around.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Service** | A scheduled event (e.g. "Sunday Morning Service"). Acts as a reusable run sheet — same structure used weekly unless the admin edits it. |
| **Program Item** | One entry in the run sheet. Has a title, department, duration (seconds), and an order position. |
| **Department** | A church team (Choir, Ushers, Media, Worship, Prayer, etc.). Created per-church by the admin. |
| **Live Session** | When a service is "live", the system tracks which program item is active, when it started, and auto-advances when the timer hits zero. |

---

## Data Model Changes

### New Models

```prisma
model Department {
  id         String        @id @default(uuid())
  name       String
  church_id  String
  church     Church        @relation(fields: [church_id], references: [id], onDelete: Cascade)
  items      ProgramItem[]
  created_at DateTime      @default(now())
  updated_at DateTime      @updatedAt
}

model ProgramItem {
  id            String      @id @default(uuid())
  title         String
  duration      Int         // seconds
  order         Int         // position in the run sheet (0-indexed)
  service_id    String
  service       Service     @relation(fields: [service_id], references: [id], onDelete: Cascade)
  department_id String?
  department    Department? @relation(fields: [department_id], references: [id], onDelete: SetNull)
  created_at    DateTime    @default(now())
  updated_at    DateTime    @updatedAt
}
```

### Modified: Service Model

Add live-state fields to the existing Service model:

```prisma
model Service {
  id          String     @id @default(uuid())
  name        String
  description String?
  date        DateTime
  recurrence  Recurrence @default(NONE)
  church_id   String
  church      Church     @relation(fields: [church_id], references: [id], onDelete: Cascade)
  created_by  String
  creator     User       @relation("CreatedBy", fields: [created_by], references: [id])

  // Run sheet
  items       ProgramItem[]

  // Live state
  is_live          Boolean   @default(false)
  current_item_id  String?   // FK to the active ProgramItem
  item_started_at  DateTime? // when the active item's timer started
  is_paused        Boolean   @default(false)

  // Keep old relation for migration (can remove later)
  tasks       Task[]

  created_at  DateTime   @default(now())
  updated_at  DateTime   @updatedAt
}
```

### Modified: Church Model

Add departments relation:

```prisma
model Church {
  // ... existing fields
  departments  Department[]
}
```

### Models to Keep (but deprioritize)

- `Task`, `Notification` — leave in schema, don't build new UI around them.
  Can remove in a future cleanup.

---

## Pages

### 1. Admin Dashboard — `/dashboard`

**Purpose:** Overview of all services and departments.

**What changes from current:**
- Stat cards show: total services, total program items across all services
- Services table shows: name, date, item count, and a **"Go Live"** button
- Each row links to the Service Builder
- Add a "Manage Departments" link/section
- Remove task-readiness progress bars (tasks are gone)

---

### 2. Service Builder — `/services/[id]`

**Purpose:** Build and edit the run sheet for a service.

**What it looks like:**
- Ordered list of program items (vertical list, numbered)
- Each item shows: order number, title, department badge, duration (mm:ss)
- **Add Item** form/dialog: title, department (dropdown), duration (minutes + seconds inputs)
- Reorder items with up/down arrow buttons
- Edit item inline or via dialog
- Delete item with confirmation
- **"Go Live"** button at the top when there are items

---

### 3. New Service — `/services/new`

**Purpose:** Create a new service (simplified).

**Fields:** Name, date, description (optional), recurrence.
Program items are added afterwards in the Service Builder.

---

### 4. Live Control — `/services/[id]/control`

**Purpose:** Admin's control panel during a live service. This is open on the
admin's phone/laptop during the service.

**What it shows:**
- Full run sheet with all items listed
- Current item highlighted with a large countdown timer
- Previous items shown as completed (grayed/checked)
- Upcoming items visible below
- Next item preview: "Next: Choir — Worship (3:00)"

**Controls:**
- **Pause / Resume** — pauses the countdown
- **Skip to Next** — manually advance to the next item
- **End Service** — stop the live session

**Auto-advance logic:**
- Timer runs client-side, computed from `item_started_at` + `duration`
- When timer reaches 0, the control page automatically fires
  `POST /api/services/[id]/live/next`
- Server updates `current_item_id` and `item_started_at`
- If it's the last item, server sets `is_live = false`

**Share button:** Copy the live display link (`/live/[id]`)

---

### 5. Live Display — `/live/[id]`

**Purpose:** The screen everyone watches. Gets projected/displayed on a TV or
monitor. No auth required (public-ish, accessed via shared link).

**Design:**
- Full-screen, no navbar, no clutter
- Dark background, large white text
- Shows ONLY:
  - **Current item:** big title + department + countdown timer (mm:ss)
  - **Up next:** next item title + department
- As timer gets low (≤60s), show: "Next: [Department] in [seconds]s"
- When transitioning between items, smooth crossfade/slide animation
- When service ends, show "Service Complete" message

**Real-time approach:**
- Polls `GET /api/services/[id]/live/state` every 2 seconds
- Timer countdown is computed client-side for smooth display
- Poll catches state changes (admin paused, skipped, ended, etc.)

---

### 6. Departments — `/departments`

**Purpose:** Admin CRUD for departments.

**Simple page:**
- List of departments for the church
- Add department (name input + button)
- Delete department (with confirmation)
- No complex UI needed

---

## API Routes

### New Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/departments` | Admin | List church departments |
| `POST` | `/api/departments` | Admin | Create department |
| `DELETE` | `/api/departments/[id]` | Admin | Delete department |
| `GET` | `/api/services/[id]/items` | Admin | List program items for a service |
| `POST` | `/api/services/[id]/items` | Admin | Add a program item |
| `PUT` | `/api/services/[id]/items/reorder` | Admin | Reorder items (accepts array of {id, order}) |
| `PUT` | `/api/items/[id]` | Admin | Update a program item |
| `DELETE` | `/api/items/[id]` | Admin | Delete a program item |
| `POST` | `/api/services/[id]/live/start` | Admin | Start live session (sets first item active) |
| `POST` | `/api/services/[id]/live/next` | Admin | Advance to next item (or end if last) |
| `POST` | `/api/services/[id]/live/pause` | Admin | Toggle pause/resume |
| `POST` | `/api/services/[id]/live/stop` | Admin | End live session |
| `GET` | `/api/services/[id]/live/state` | **Public** | Get current live state (for display screen) |

### Live State Response Shape

```json
{
  "isLive": true,
  "isPaused": false,
  "currentItem": {
    "id": "...",
    "title": "Worship",
    "department": "Worship Team",
    "duration": 1200,
    "order": 2
  },
  "nextItem": {
    "id": "...",
    "title": "Offering",
    "department": "Ushers",
    "duration": 600,
    "order": 3
  },
  "itemStartedAt": "2026-02-09T09:15:00.000Z",
  "totalItems": 8,
  "currentIndex": 2,
  "serviceName": "Sunday Morning Service"
}
```

### Existing Routes to Modify

- `GET /api/services` — include `_count: { items: true }` instead of tasks
- `GET /api/services/[id]` — include `items` with department, ordered by `order`
- `POST /api/services` — keep as-is (creates shell service, items added separately)

### Existing Routes to Keep (unused for now)

- Task-related routes (`/api/tasks/*`, `/api/my-tasks`, `/api/services/[id]/tasks`)
- Notification routes — keep, may reuse later
- User routes — keep for admin user list

---

## Implementation Order

### Phase 1: Data Layer
1. Add `Department` and `ProgramItem` models to Prisma schema
2. Add live-state fields to `Service` model
3. Run migration
4. Create API routes for departments CRUD
5. Create API routes for program items CRUD + reorder

### Phase 2: Admin Pages
6. Build Departments page (`/departments`)
7. Rework Service Builder page (`/services/[id]`) — ordered item list with add/edit/delete/reorder
8. Update Dashboard — show item counts, add "Go Live" button, remove task progress
9. Simplify New Service form

### Phase 3: Live System
10. Build live API routes (start, next, pause, stop, state)
11. Build Live Control page (`/services/[id]/control`)
12. Build Live Display page (`/live/[id]`)

### Phase 4: Polish
13. Smooth animations on live display transitions
14. "Copy live link" sharing UX
15. Clean up old task-related UI (hide My Tasks, remove task references from dashboard)

---

## Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Real-time | Polling (2s interval) | Simplest, no extra infra. Timer is client-side so display is smooth. Poll catches admin actions. Good enough for a church service. |
| Timer source of truth | Server (`item_started_at` + `duration`) | Display computes remaining time client-side as `duration - (now - itemStartedAt)`. No drift issues. |
| Auto-advance trigger | Admin's control page | When timer hits 0 on admin's browser, it fires `/live/next`. Single source of truth. If admin closes browser, service pauses (acceptable). |
| Live display auth | Public (no login) | Anyone with the link can view. The link contains the service UUID which is unguessable. No sensitive data exposed. |
| Item reordering | Up/down buttons | Simpler than drag-and-drop. Can add DnD later if wanted. |

---

## What Gets Removed/Hidden

- **My Tasks page** (`/my-tasks`) — hide from navbar, keep route for now
- **Task assignment UI** in service detail — replaced by program items
- **Task progress bars** on dashboard — replaced by item count
- **Volunteer dropdown** in service detail — not needed
- Old jargon labels (Protocol, Node, Ecosystem, etc.) — use plain language

---

## Out of Scope (for now)

- Over-time handling (timer goes negative)
- Department-specific views (each dept sees only their items)
- Drag-and-drop reordering
- Push notifications / email reminders
- Service history / reports
- Duplicating a service as template

# Context Library Sidebar Structure - Complete Explanation

**Date:** 2025-01-10
**Time:** 7:45 PM EST

## Visual Structure (Exact Layout)

```
📂 ACTIVE DIRECTORY
┃
├─ 📁 Active Docs (+ button on hover)  ← Level 0 - Your documents from Supabase
┃  ├─ 📄 Document 1                    ← Level 1 - Nested under Active Docs
┃  └─ 📄 Document 2                    ← Level 1
┃
├─ 👤 Bob's Ditto (You)                ← Level 0 - Your own shareable profile
┃  ├─ 📄 Bob's Rules.pdf               ← Level 1 - Your profile files
┃  └─ 📄 Context Examples.txt          ← Level 1
┃
└─ 📎 Active Files                     ← Level 0 - Files in AI context
   ├─ 📄 Active file 1.pdf             ← Level 1 - Active context files
   └─ 📄 Active file 2.docx            ← Level 1

───────────────────────────────────────

📂 RELEVANT (Shared Content)
┃
├─ 📁 Files                            ← Level 0 - General file storage
┃  ├─ 📄 File 1.pdf                    ← Level 1 - Stored files
┃  └─ 📄 File 2.docx                   ← Level 1
┃
├─ 👤 Kyle's Ditto                     ← Level 0 - Shared by Kyle
┃  ├─ 📄 Kyle's Rules.pdf              ← Level 1 - Kyle's shared files
┃  └─ 📄 Style Guide.txt               ← Level 1
┃
└─ 👤 Alfonso's Ditto                  ← Level 0 - Shared by Alfonso
   ├─ 📄 Alfonso's doc.pdf             ← Level 1 - Alfonso's shared files
   └─ 📄 Brand Standards.pdf           ← Level 1
```

## How It Works

### Active Directory (Top 3 Items)

**1. Active Docs**
- **Data Source:** Supabase `documents` table
- **Level:** 0 (top level, not indented)
- **Children:** User's documents (level 1, indented 24px)
- **+ Button:** ✅ FIXED - Now shows on hover even when empty!
- **Purpose:** User's workspace documents

**2. User's Ditto (e.g., "Bob's Ditto")**
- **Data Source:** Supabase `dittos` table where `user_id = current_user`
- **Level:** 0 (top level, NOT nested in any folder)
- **Children:** User's profile files (level 1, indented 24px)
- **Badge:** "You" badge indicates it's YOUR ditto
- **Purpose:** Your shareable profile that appears in other users' "RELEVANT" section when you share content

**3. Active Files**
- **Data Source:** Supabase `uploaded_files` where `is_active = true`
- **Level:** 0 (top level, not indented)
- **Children:** Files currently in AI context (level 1, indented 24px)
- **Purpose:** Files the AI can reference when chatting

### Relevant Section (Remaining Items)

**1. Files Folder**
- **Data Source:** Supabase `uploaded_files` where `is_active = false`
- **Level:** 0 (top level, not indented)
- **Children:** General uploaded files (level 1, indented 24px)
- **Purpose:** File storage (not in AI context)

**2. Other Users' Dittos (e.g., "Kyle's Ditto", "Alfonso's Ditto")**
- **Data Source:** Supabase `dittos` joined with `shares` table
- **Level:** 0 (top level, NOT nested in Files folder!)
- **Children:** Files that user shared with you (level 1, indented 24px)
- **Hover Action:** 3-dot menu → "View Profile" (shows LinkedIn, websites, etc.)
- **Purpose:** Shared content organized by who shared it

## Key Points

### Dittos Are NOT Folders

❌ **NOT:** "Dittos are inside the Files folder"
✅ **CORRECT:** "Dittos are their own top-level items (level 0)"

**Explanation:**
- Each Ditto represents a USER, not a folder
- Dittos organize content by WHO shared it
- Dittos appear at level 0 (same indentation as Active Docs and Files)
- The files INSIDE a ditto are level 1 (indented 24px to show they belong to that user)

### Indentation Levels

```
Level 0 (0px left padding + 12px base):
  - Active Docs
  - Bob's Ditto (You)
  - Active Files
  - Files folder
  - Kyle's Ditto
  - Alfonso's Ditto

Level 1 (24px left padding + 12px base = 36px total):
  - Documents inside Active Docs
  - Files inside Bob's Ditto
  - Files inside Active Files
  - Files inside Files folder
  - Files inside Kyle's Ditto
  - Files inside Alfonso's Ditto

Level 2 (48px left padding + 12px base = 60px total):
  - Subfolders (if nested folders exist)
```

**Code Reference:** [data-sidebar.tsx:497](src/components/ai-elements/data-sidebar.tsx#L497)
```typescript
style={{ paddingLeft: `${level * 24 + 12}px`, paddingRight: '12px' }}
```

## Recent Fixes (2025-01-10)

### ✅ Fixed: Missing + Button

**Before:**
```typescript
{item.id === 'active-docs' && hasChildren && (
```

**After:**
```typescript
{item.id === 'active-docs' && (
```

**What Changed:**
- Removed `hasChildren &&` condition
- Now button shows even when Active Docs is empty
- Still hidden until you hover (opacity-0 → opacity-100)

**Location:** [data-sidebar.tsx:619](src/components/ai-elements/data-sidebar.tsx#L619)

### ✅ Verified: Dittos Are NOT Indented

**Status:** Structure is correct!
- All dittos render at level 0
- No nesting inside other folders
- Only their children files are indented (level 1)

## Database Mapping

| UI Element | Supabase Table | Query |
|------------|----------------|-------|
| Active Docs | `documents` | `WHERE owner_id = current_user` |
| Active Docs children | `documents` | Individual documents |
| User's Ditto | `dittos` | `WHERE user_id = current_user` |
| Active Files | `uploaded_files` | `WHERE is_active = true` |
| Files folder | `uploaded_files` | `WHERE is_active = false` |
| Other Dittos | `dittos` + `shares` | `JOIN shares WHERE shared_with = current_user` |
| Shared files | `documents` | Via `shares` table |

## How Sharing Works

1. **User shares a document:**
   - Record created in `shares` table
   - `owner_id` = sharer's user ID
   - `shared_with_user_id` = recipient's user ID
   - `resource_id` = document ID
   - `permission` = 'view' or 'edit'

2. **Recipient sees shared content:**
   - Sharer's Ditto appears in recipient's "RELEVANT" section
   - Shared document appears as child of sharer's Ditto
   - Hover over Ditto → 3-dot menu → "View Profile"

3. **Example:**
   - Kyle shares "Style Guide.txt" with you
   - "Kyle's Ditto" appears in your RELEVANT section
   - "Style Guide.txt" appears under Kyle's Ditto
   - Click to view, edit (if permission allows)

## Code Reference

**Main File:** `/src/components/ai-elements/data-sidebar.tsx`

**Key Functions:**
- `dataWithActiveDocs` (line 174): Merges Active Docs with static data
- `renderItem` (line 481): Renders each item with proper indentation
- ACTIVE DIRECTORY section (line 742): First 3 items
- RELEVANT section (line 757): Remaining items

**State:**
- `expandedIds`: Which folders/dittos are expanded
- `documents`: Documents from Supabase (via props)
- `data`: Static data (dittos, files, etc.)

## Testing

To verify the structure:

1. Open `/chat-doc`
2. Hover over "Active Docs" → **+ button should appear**
3. Check indentation:
   - Active Docs, Bob's Ditto, Active Files should align (level 0)
   - Files, Kyle's Ditto, Alfonso's Ditto should align (level 0)
   - All child files should be indented (level 1)
4. Expand/collapse folders to see children

---

**End of Document**

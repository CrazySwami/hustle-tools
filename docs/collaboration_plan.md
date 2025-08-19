# Real-Time Collaboration Feature: Implementation Plan

This document outlines the plan to implement real-time collaborative editing and commenting features in the Chat-Doc-Editor, using Tiptap, Y.js, and Supabase.

---

## Phase 1: Backend Setup (Supabase)

The foundation of our collaboration feature lies in a robust backend setup. We will use Supabase for authentication, database storage, and real-time communication.

### 1. User Authentication

**Objective**: Ensure every user is identifiable.

*   **Action**: We must use Supabase Auth to manage users. If not already implemented, we will need to add login/signup flows.
*   **Reasoning**: User IDs are critical for tracking document changes, displaying user cursors with names, and attributing comments.

### 2. Database Schema

**Objective**: Create tables to store documents and manage access.

*   **Action**: We will create two new tables in your Supabase database.

    **Table 1: `documents`**

    ```sql
    CREATE TABLE public.documents (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      owner_id UUID REFERENCES auth.users(id) NOT NULL,
      title TEXT,
      content JSONB -- Stores the Tiptap document as JSON
    );
    ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
    ```

    **Table 2: `document_collaborators`** (for sharing)

    ```sql
    CREATE TABLE public.document_collaborators (
      document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      PRIMARY KEY (document_id, user_id)
    );
    ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;
    ```

### 3. Row Level Security (RLS) & Realtime

**Objective**: Secure document access and real-time channels.

*   **Action**: We will implement RLS policies to control who can read/write documents and listen to real-time updates.

    **Policies for `documents` table:**
    *   Allow users to create new documents.
    *   Allow the owner to read, update, and delete their own documents.
    *   Allow collaborators to read and update documents they are shared with.

    **Policies for Realtime:**
    *   We will use Supabase's built-in Realtime policies to ensure that only users with access to a document (owner or collaborator) can subscribe to its corresponding real-time channel.

---

## Phase 2: Frontend Dependencies

**Objective**: Install the necessary libraries for collaboration.

*   **Action**: We will run the following command to add the required packages:

    ```bash
    npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor yjs
    ```

*   **Provider**: We will also need a Y.js provider for Supabase. We can use a community-built one like `y-supabase` or create a lightweight one ourselves. We will start by investigating `y-supabase`.

---

## Phase 3: Frontend Implementation

**Objective**: Integrate the collaboration features into the React application.

### 1. Supabase Realtime Provider

*   **Action**: We will create a custom React hook (e.g., `useSupabaseCollaboration`) that will:
    1.  Accept a document ID as an argument.
    2.  Initialize a `Y.Doc` instance.
    3.  Create a Supabase client and subscribe to a unique channel for the document (e.g., `doc-realtime:${documentId}`).
    4.  Listen for `broadcast` events on the channel to receive and apply updates from other users.
    5.  Broadcast local document changes to other users in the channel.
    6.  Manage user presence (online/offline status) using Supabase's Presence feature.

### 2. Tiptap Editor Integration

*   **Action**: We will update `TiptapEditor.tsx`:
    1.  Import and add `Collaboration` and `CollaborationCursor` to the list of Tiptap extensions.
    2.  Configure the `Collaboration` extension with the `Y.Doc` instance from our custom hook.
    3.  Configure the `CollaborationCursor` extension with the current user's name and a unique color to display their cursor to others.

### 3. Document Loading & Saving

*   **Action**: The `chat-doc-editor` page will be modified to:
    1.  Fetch the document from the `documents` table in Supabase on page load.
    2.  Use the fetched `content` to initialize the editor.
    3.  Implement a mechanism to periodically save the latest `Y.Doc` state back to the `documents` table to ensure persistence.

---

## Phase 4: User & Comment Enhancements

**Objective**: Attribute actions to users and add comment features.

### 1. User Identification & Cursors

*   **Action**: We will fetch the current user's data from Supabase Auth and pass their name and a generated color to the `CollaborationCursor` provider. This will make cursors appear with user names.

### 2. Advanced Comments

*   **Action**: We will extend the existing comment functionality:
    1.  **Attribution**: When a user creates a comment, we will inject their `user_id` into the comment's data.
    2.  **State Management**: We will add a `status` field (e.g., 'open', 'resolved') to the comment's data structure.
    3.  **UI**: We will add a "Resolve" button to each comment, which will update its status. This change will be synced to all users in real-time as it's part of the document content.

---

## Information Needed

To proceed, please provide the following information:

1.  **Supabase Auth**: Is Supabase Authentication already set up in this project?
2.  **Supabase Project**: Do you have an existing Supabase project to use, or should we plan for a new one?

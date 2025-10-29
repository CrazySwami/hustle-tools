# Edit Flow Issues - Diagnosis

**Date:** October 26, 2025

## User-Reported Issues

### Issue 1: viewEditorCode Tool Triggers File Loading UI
**Problem:** When AI calls `viewEditorCode`, it shows a UI with buttons to select which files to load, nothing happens when you click them.

**Root Cause:** The `viewEditorCodeTool` returns UI metadata instead of actual code content. The AI thinks it's getting code, but it's actually getting a widget that requires user interaction.

**Expected Behavior:** AI should get actual code content to read and analyze.

### Issue 2: AI Only Edits One File When Asked to Edit Multiple
**Problem:** User says "edit HTML and CSS", AI only edits HTML.

**Root Cause:** Unknown - need to check if it's:
- AI not calling editCode twice
- System stopping after first tool call
- maxSteps configuration

### Issue 3: DiffEditor Shows Before User Accepts
**Problem:** User sees DiffEditor in Monaco before clicking "Accept" button.

**Expected Behavior:**
1. Widget shows cooking animation → shows compact review card → user clicks "Accept & Apply"
2. THEN DiffEditor appears in Monaco editor
3. Currently it's appearing too early

### Issue 4: DiffEditor Shows "I don't have any current HTTP, HTML, or CSS code"
**Problem:** After accepting changes, DiffEditor shows empty/error message instead of actual diff.

**Root Cause:** DiffData might have empty original/modified strings, or diffData is not properly passed.

### Issue 5: No Accept/Decline After DiffEditor Shows
**Problem:** Once DiffEditor shows, there's only a "Close" button, no way to accept/decline.

**Expected Behavior:** This is actually correct - by the time DiffEditor shows, changes are already applied (user clicked "Accept & Apply" in widget). DiffEditor is just for review.


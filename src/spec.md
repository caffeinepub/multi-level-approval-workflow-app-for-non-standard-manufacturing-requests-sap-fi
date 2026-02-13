# Specification

## Summary
**Goal:** Build a multi-level (8–9 levels) approval workflow app for non-standard manufacturing requests with Internet Identity authentication, strict per-user/per-approver authorization, and a SAP Fiori-like web UI.

**Planned changes:**
- Add Internet Identity sign-in/sign-out and use each caller’s Principal for authorization across frontend and backend.
- Implement persistent backend data model for requests, including header fields, ordered 8–9 approval levels, per-level approval records (status/actor/timestamp/comment), current level, and overall status.
- Enforce backend authorization so request creators only access their own requests, and approvers only see/act on requests assigned to their current approval level.
- Add backend workflow actions: create/save draft, submit, approve current level (advance), reject (stop), and fetch request details + immutable approval history.
- Build SAP Fiori-like UI pages: Create Request (with validation + submit), My Requests (list + statuses + current level), My Approvals inbox (actionable only), and a detail view showing request info and approval history.
- Implement role-based navigation and conditional UI controls so Approve/Reject only appear for authorized approvers; unauthenticated users are blocked from approval actions.
- Apply a consistent, clean enterprise theme inspired by SAP Fiori using Tailwind styling (avoid blue/purple-centric palette) and consistent loading/empty/error states.

**User-visible outcome:** Users can sign in with Internet Identity, create and submit non-standard requests, track them in “My Requests,” and (if assigned as an approver) see only their actionable items in “My Approvals,” with the ability to approve/reject at the correct level and view full request history.

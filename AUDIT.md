# Slothunter Feature Audit & Progress Tracker

> Auto-generated from spec analysis. Mark `[x]` when implemented.

---

## ✅ FULLY IMPLEMENTED

- [x] SvelteKit + Svelte 5 Runes ($state, $derived, $props, $effect)
- [x] Skeleton UI v3 + hamlindigo theme
- [x] Tailwind CSS v4
- [x] MongoDB Atlas + Mongoose (9 schemas)
- [x] Vercel deployment (adapter-auto)
- [x] JWT auth with HTTP-only cookies
- [x] RBAC hooks (Admin/Staff route protection)
- [x] Mobile-first AppShell with bottom nav
- [x] Unavailability Calendar (staff marks dates)
- [x] Unavailability cutoff (15th of month)
- [x] Admin Holiday management page
- [x] Admin Config page
- [x] Admin Employee management (add/toggle active)
- [x] Solver Web Worker with 13 eligibility checks
- [x] Solver Objective Function (lexicographic)
- [x] Solver Strategy A (6 sub-strategies × 25 restarts)
- [x] Solver API (data gathering + save results)
- [x] Admin Solver trigger UI with progress bar
- [x] Roster view API
- [x] Staff Roster view (calendar + list views)
- [x] Staff Slot Selection page (basic)
- [x] Roster Management API (finalize, copy, updateSlot)
- [x] Audit Logging (RosterLog model + API)
- [x] Excel Export API (exceljs)
- [x] Database seeding endpoint
- [x] Solver slot templates (weekday/weekend/holiday)

---

## ❌ NOT IMPLEMENTED — HIGH PRIORITY

- [ ] **PWA Configuration** — `@vite-pwa/sveltekit` in package.json but NOT configured. No manifest, no service worker.
- [x] **AE Assignment Management Page** — `/admin/ae` - IPP/OPD toggle per day with month navigation
- [x] **Preselection Page** — `/admin/preselections` - add/remove staff locks with date/slot/employee picker
- [ ] **Phase Configuration Page** — Admin sets phase dates and slot quotas (Phase 1: 1 Weekend + 2 Weekday, etc.)
- [ ] **Phase-Aware Slot Claiming** — Staff selection page doesn't enforce phase quotas per staff.
- [x] **Charts Page** — `/admin/charts` - hours bar chart, AE/PH counts table, summary cards. `/staff/summary` - personal stats.
- [ ] **Copy Roster View/Edit Page** — API exists for creating copy, but no UI page for viewing/editing.
- [x] **Audit Log View Page** — `/admin/logs` - filterable by date, shows action/dates/slot/old-new employee
- [x] **Roster Status Management UI** — `/admin/roster` - buttons for Draft→Phase1→Phase2→Phase3→Final, copy roster button
- [x] **Excel Export Button in UI** — Excel button on admin roster page and staff roster page
- [ ] **Roster Slot Editing UI** — Admin needs to edit individual slots (swap employees) on roster.

---

## ❌ NOT IMPLEMENTED — MEDIUM PRIORITY

- [ ] Solver Run 1 vs Run 2 modes (AE/Holidays only vs cleanup)
- [ ] Solver Strategy B (Beam Search) — simplified to re-running Strategy A
- [ ] Skeleton DataTable for staff management and logs
- [ ] Skeleton Toast notifications
- [ ] Skeleton Modal confirmations
- [ ] Excel Template Fidelity — missing signature footer, precise column widths
- [ ] POST-AE auto-sync when AE slot changed on copy roster
- [ ] Archive Loading — solver archive param hardcoded to empty array

---

## ❌ NOT IMPLEMENTED — LOW PRIORITY

- [ ] Solver Strategy C (Fallback)
- [ ] Skeleton Calendar Component (uses custom grid)
- [ ] Copyright Page (admin and staff)
- [ ] Eligibility Log Page UI
- [ ] Login page uses Svelte 4 `on:submit|preventDefault` syntax

---

## ⚠️ PARTIALLY IMPLEMENTED

- [ ] **Excel Export** — Missing signature footer, column width precision, conditional formatting
- [ ] **Solver Strategies** — A works, B simplified, C missing
- [ ] **Staff Selection** — Basic list exists, no phase quota enforcement
- [ ] **Roster Management** — API has finalize/copy/updateSlot but no UI pages
- [ ] **AppShell** — Uses basic div layout instead of Skeleton's `AppShell` component
- [ ] **Data Density** — Admin dashboard is basic cards, not DataTable as specified
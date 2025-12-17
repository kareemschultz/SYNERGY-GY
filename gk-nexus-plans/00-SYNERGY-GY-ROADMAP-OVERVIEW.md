# SYNERGY-GY Development Roadmap Overview

> **Project:** SYNERGY-GY (GK-Nexus) - Practice Management System
> **Businesses:** GCMC (Training/Consulting) | KAJ (Tax/Accounting)
> **Location:** Georgetown, Guyana
> **Currency:** GYD | **VAT Rate:** 14%

---

## 📋 Plan Files Index

| # | Plan File | Priority | Status | Est. Effort |
|---|-----------|----------|--------|-------------|
| 01 | [Document Management Overhaul](./01-document-management-overhaul.md) | P0 - Critical | 🟡 70% Complete | 1-2 weeks |
| 02 | [UI/UX Visual Polish](./02-ui-ux-visual-polish.md) | P1 - High | 🔴 Not Started | 1 week |
| 03 | [Templates & Forms System](./03-templates-forms-system.md) | P2 - Medium | 🔴 Not Started | 2-3 weeks |
| 04 | [Enhancements & Gap Analysis](./04-enhancements-gap-analysis.md) | P3 - Backlog | 🔴 Not Started | Ongoing |

> **Last Updated:** December 17, 2024

---

## 🎯 Execution Order

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1 (Weeks 1-2): Document Management                       │
│  ├── Fix category dropdown bug                                  │
│  ├── Fix search functionality                                   │
│  ├── Add document-client/matter linking                         │
│  ├── Implement tags system                                      │
│  └── Add Knowledge Base to sidebar                              │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2 (Week 3): UI/UX Polish                                 │
│  ├── Visual consistency audit                                   │
│  ├── Accessibility compliance (WCAG 2.1 AA)                     │
│  ├── Fix visual defects                                         │
│  └── Responsive design verification                             │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3 (Weeks 4-6): Templates System                          │
│  ├── Template editor with variables                             │
│  ├── GRA forms (PAYE, VAT, Income Tax)                          │
│  ├── NIS forms (Registration, Contributions, Claims)            │
│  ├── Legal templates (Affidavits, POA, Agreements)              │
│  └── Business correspondence templates                          │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4 (Ongoing): Enhancements                                │
│  ├── Client portal improvements                                 │
│  ├── Calendar/deadline system                                   │
│  ├── Reporting dashboard                                        │
│  └── Workflow automation                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐛 Known Issues (From Current Audit)

### Critical (Blocking)
- ⏳ Document category dropdown not working (NEEDS VERIFICATION)
- [x] ~~Document search not functioning~~ **FIXED Dec 17** - Search now includes tags
- [x] ~~Knowledge Base missing from sidebar navigation~~ **FIXED Dec 17**

### High Priority
- [x] ~~Tags can only be added manually~~ **PARTIAL** - Tags now displayed in list/quickview, search works
- [x] ~~Cannot link documents to clients/matters~~ **ALREADY WORKING**
- [ ] Various UI inconsistencies (duplicate category color definitions)

### Medium Priority
- [ ] No template system for GRA/NIS forms (Template system EXISTS, needs form content)
- [ ] Limited reporting capabilities
- [ ] No calendar view for deadlines

---

## 🏗️ Tech Stack Reference

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TanStack Router, TanStack Query v5, Vite, TailwindCSS v4, shadcn/ui |
| **Backend** | Hono 4.x, oRPC, Bun runtime, Drizzle ORM, Better Auth |
| **Database** | PostgreSQL 17 |
| **Deployment** | Docker, Vultr VPS |

---

## 📁 Key Directories

```
SYNERGY-GY/
├── apps/
│   ├── web/              # Frontend React app
│   └── server/           # Backend Hono API
├── packages/
│   ├── api/              # oRPC routers
│   ├── db/               # Drizzle schema & migrations
│   └── shared/           # Shared types & utilities
├── .claude/
│   ├── CLAUDE.md         # Coding standards (AI reads this)
│   └── plans/            # Planning documents (put these here)
└── docker-compose.yml
```

---

## 🚀 How to Execute Plans

### Using Claude Code:

```bash
# 1. Start with a specific plan
claude "Let's work on Plan 01 - Document Management. Read .claude/plans/01-document-management-overhaul.md and begin implementation."

# 2. Check progress
claude "Show me the status of Plan 01 tasks"

# 3. Continue work
claude "Continue with the next task in Plan 01"
```

### Progress Tracking:

Update status in each plan file:
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete
- ⏸️ Blocked

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| TypeScript Errors | 0 | ~30 |
| Document Search Speed | <2s | N/A (broken) |
| Template Coverage | 80% common forms | 0% |
| WCAG Compliance | AA | Not audited |
| Mobile Responsive | 100% pages | Not verified |

---

## 📞 Guyana-Specific Requirements

### GRA (Guyana Revenue Authority)
- eServices portal: https://eservices.gra.gov.gy
- Forms: https://www.gra.gov.gy/forms/
- PAYE deadlines: 14th of following month
- VAT returns: 21st of following month

### NIS (National Insurance Scheme)
- Contribution rates: Employee 5.6%, Employer 8.4% (Total 14%)
- Maximum insurable earnings: GYD 280,000/month
- Payment deadline: 15th of following month
- Online checking: https://www.nis.org.gy

### DCRA (Deeds and Commercial Registries)
- Forms: https://dcraguyana.com/forms/
- Business registration and annual returns

---

## 📝 Notes

- All monetary values in GYD (Guyanese Dollars)
- VAT rate is 14% (standard rate)
- Tax year follows calendar year (Jan-Dec)
- GRA eServices requires Adobe PDF Reader for forms
- NIS numbers format: A1234567 (no dashes or spaces)

---

*Last Updated: December 2024*
*Created for: Claude Code AI-assisted development*

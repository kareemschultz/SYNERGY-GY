---
title: System Reference
description: Technical reference for GK-Nexus system components, document types, and status codes
---

This reference guide provides technical details about GK-Nexus system components and configurations.

## Matter Status Codes

| Status | Description | When to Use |
|--------|-------------|-------------|
| `NEW` | Matter just created | Initial state after creation |
| `IN_PROGRESS` | Actively being worked on | When staff begins work |
| `PENDING` | Awaiting external action | Waiting for GRA, client docs, etc. |
| `ON_HOLD` | Temporarily paused | Client request or internal hold |
| `COMPLETED` | Work finished | All deliverables provided |
| `CANCELLED` | Matter cancelled | Client cancelled or invalid |

## Document Categories

| Category | Code | Description |
|----------|------|-------------|
| Agreement | `AGREEMENT` | Contracts, service agreements, MOUs |
| Affidavit | `AFFIDAVIT` | Sworn statements, statutory declarations |
| Certificate | `CERTIFICATE` | Registration certificates, completion certs |
| Application | `APPLICATION` | Application forms, submissions |
| Financial | `FINANCIAL` | Financial statements, bank letters |
| Identification | `IDENTIFICATION` | ID cards, passports, TIN |
| Tax | `TAX` | Tax returns, receipts, assessments |
| Immigration | `IMMIGRATION` | Visas, work permits, travel docs |
| Legal | `LEGAL` | Legal documents, court papers |
| Correspondence | `CORRESPONDENCE` | Letters, emails, communications |
| Supporting | `SUPPORTING` | Supporting documents, evidence |
| Other | `OTHER` | Miscellaneous documents |

## Client Types

| Type | Description |
|------|-------------|
| `INDIVIDUAL` | Personal client - tax returns, personal legal matters |
| `ORGANIZATION` | Business client - corporate services, company matters |

## Staff Roles

| Role | Access Level | Description |
|------|--------------|-------------|
| `OWNER` | Full | Complete system access, all businesses |
| `GCMC_MANAGER` | GCMC Full | Manage all GCMC operations and staff |
| `KAJ_MANAGER` | KAJ Full | Manage all KAJ operations and staff |
| `STAFF_GCMC` | GCMC Standard | Handle GCMC client matters |
| `STAFF_KAJ` | KAJ Standard | Handle KAJ client matters |
| `STAFF_BOTH` | Both Standard | Handle matters for both businesses |
| `RECEPTIONIST` | Limited | Front desk, basic client lookup |

## Business Codes

| Code | Business Name |
|------|---------------|
| `GCMC` | Green Crescent Management Consultancy |
| `KAJ` | Kareem Abdul-Jabar Tax & Accounting Services |

## Service Categories

### GCMC Services

| Service | Category | Typical Duration |
|---------|----------|------------------|
| Company Incorporation | Business Development | 3-7 business days |
| Business Registration | Business Development | 1-3 business days |
| Work Permit | Immigration | 4-8 weeks |
| Citizenship Application | Immigration | 6-12 months |
| Business Visa | Immigration | 2-4 weeks |
| Affidavit | Paralegal | Same day - 2 days |
| Agreement Preparation | Paralegal | 1-5 business days |
| Will Preparation | Paralegal | 3-7 business days |
| Training Program | Training | 1-5 days |
| Business Proposal | Consulting | 1-2 weeks |

### KAJ Services

| Service | Category | Typical Deadline |
|---------|----------|------------------|
| Income Tax Return | Tax | April 30 annually |
| Corporate Tax Return | Tax | April 30 annually |
| VAT Return | Tax | 21st of following month |
| PAYE Return | Tax | 15th of following month |
| Annual PAYE | Tax | March 31 |
| NIS Registration | NIS | N/A (as needed) |
| NIS Contributions | NIS | 15th of following month |
| Financial Statement | Financial | As required |

## Government Agency References

### Guyana Revenue Authority (GRA)
- Income Tax Division
- VAT Division
- Compliance and Enforcement

### National Insurance Scheme (NIS)
- Registration
- Contributions
- Benefits and Pensions

### Deeds and Commercial Registries
- Company Registration
- Business Names
- Deeds Registration

### Ministry of Home Affairs
- Immigration Department
- Citizenship Unit

### Ministry of Legal Affairs
- Supreme Court Registry
- Magistrate Courts

## File Upload Limits

| Setting | Value |
|---------|-------|
| Maximum file size | 10 MB |
| Allowed file types | PDF, DOC, DOCX, XLS, XLSX, JPG, PNG |
| Documents per matter | Unlimited |

## System URLs

| Environment | URL |
|-------------|-----|
| Production | Configured by administrator |
| Health Check | `/health` |
| API Base | `/rpc/*` |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search |
| `Escape` | Close modal/dialog |

## Support Contacts

For technical issues with the GK-Nexus system, contact your system administrator.

For service-related questions, contact the appropriate business:
- **GCMC services**: Contact GCMC management
- **KAJ services**: Contact KAJ management

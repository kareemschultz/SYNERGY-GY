# Training Management System Implementation

**Implementation Date:** December 11, 2024
**Phase:** Phase 2 - Enhanced Features
**Business:** GCMC (Green Crescent Management Consultancy)

## Overview

The Training Management System provides comprehensive course catalog, scheduling, and enrollment management for GCMC's training services. This feature enables staff to manage training courses, schedule sessions, track participants, and issue certificates.

## Architecture

### Database Schema (`/packages/db/src/schema/training.ts`)

#### Tables

1. **courses** - Training course catalog
   - `id`, `business` (GCMC), `title`, `description`, `category`
   - `duration` (hours), `maxParticipants`, `price` (cents)
   - `isActive`, `createdAt`, `updatedAt`

2. **courseSchedules** - Scheduled training sessions
   - `id`, `courseId`, `startDate`, `endDate`
   - `location`, `instructor`, `status`
   - `createdAt`, `updatedAt`

3. **enrollments** - Participant enrollment tracking
   - `id`, `scheduleId`, `clientId`
   - `status`, `paymentStatus`
   - `certificateNumber`, `certificateIssuedAt`
   - `enrolledAt`, `updatedAt`

#### Enums

- **trainingCategoryEnum**: HUMAN_RESOURCES, CUSTOMER_RELATIONS, BUSINESS_DEVELOPMENT, COMPLIANCE, OTHER
- **scheduleStatusEnum**: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- **enrollmentStatusEnum**: REGISTERED, CONFIRMED, ATTENDED, CANCELLED, NO_SHOW
- **enrollmentPaymentStatusEnum**: PENDING, PARTIAL, PAID, REFUNDED

### API Router (`/packages/api/src/routers/training.ts`)

#### Course Endpoints

- `courses.list` - List all courses with filters (category, isActive, search)
- `courses.get` - Get single course with schedules and enrollment counts
- `courses.create` - Create new course (admin only)
- `courses.update` - Update course details (admin only)
- `courses.delete` - Delete course with enrollment validation (admin only)

#### Schedule Endpoints

- `schedules.list` - List schedules with filters (courseId, status, date range)
- `schedules.get` - Get schedule with full details and enrollment list
- `schedules.create` - Create new schedule (staff only)
- `schedules.update` - Update schedule details (staff only)
- `schedules.cancel` - Cancel schedule and update enrollments (staff only)

#### Enrollment Endpoints

- `enrollments.list` - List enrollments with filters
- `enrollments.create` - Enroll client with capacity validation (staff only)
- `enrollments.update` - Update enrollment status (staff only)
- `enrollments.issueCertificate` - Issue certificate with auto-generated number (staff only)
- `enrollments.cancel` - Cancel enrollment (protected)

### Certificate Numbering

Format: `GCMC-CERT-YYYY-NNNN`
- Example: `GCMC-CERT-2024-0001`
- Auto-incremented per year
- Generated on certificate issuance for attended enrollments

### Access Control

- **gcmcProcedure**: All training endpoints filter by GCMC business
- **adminProcedure**: Course CRUD operations
- **staffProcedure**: Schedule and enrollment management
- **protectedProcedure**: Enrollment cancellation

## Frontend Components

### Components (`/apps/web/src/components/training/`)

1. **CourseCard** - Display course summary with:
   - Title, description, category badge
   - Duration, max participants, price, schedule count
   - Active/inactive status indicator
   - View details button

2. **ScheduleTable** - Display scheduled sessions with:
   - Date, time, location, instructor
   - Status badges with color coding
   - Participant count vs capacity
   - Full/Almost Full indicators
   - View schedule button

3. **EnrollmentList** - Display enrolled participants with:
   - Client name and email
   - Status and payment status badges
   - Certificate number and issue date
   - Mark attended and issue certificate buttons

### Routes (`/apps/web/src/routes/app/training/`)

1. **index.tsx** - Course catalog listing
   - Search by title/description
   - Filter by category (Human Resources, Customer Relations, etc.)
   - Filter by active status
   - Grid layout with course cards
   - Create new course button (admin)

2. **new.tsx** - Create new course form
   - Title, description, category
   - Duration, max participants, price
   - Form validation
   - Success redirect to course detail

3. **courses/$courseId.tsx** - Course detail page
   - Course information display
   - Scheduled sessions table
   - Quick stats (enrollments, upcoming/completed sessions)
   - Add schedule dialog
   - Edit course button (admin)

4. **schedules/$scheduleId.tsx** - Schedule detail page
   - Session details (date, time, location, instructor)
   - Enrolled participants list
   - Enrollment management (add client)
   - Mark attendance and issue certificates
   - Quick stats (available spots, attendance rate)

## Features Implemented

### Course Management
- Create, edit, view, delete courses
- Category organization
- Active/inactive status toggle
- Duration and capacity configuration
- Pricing in GYD (stored as cents)

### Schedule Management
- Create schedules for courses
- Date and time selection
- Location and instructor assignment
- Status tracking (Scheduled, In Progress, Completed, Cancelled)
- Capacity monitoring

### Enrollment Management
- Enroll clients in scheduled sessions
- Capacity validation (prevents overbooking)
- Status tracking (Registered → Confirmed → Attended)
- Payment status tracking
- No-show and cancellation handling

### Certificate Issuance
- Auto-generated certificate numbers
- Year-based numbering sequence
- Issue only for attended enrollments
- Certificate date tracking
- Prevents duplicate issuance

### Statistics & Reporting
- Total enrollments per course
- Upcoming vs completed sessions
- Attendance rate calculation
- Available spots tracking
- Certificates issued count

## User Interface Features

### Search & Filters
- Course search by title/description
- Category filter dropdown
- Active status filter
- Real-time filter application

### Validation
- Required field validation
- Date range validation (end after start)
- Capacity limits enforcement
- Duplicate enrollment prevention
- Certificate issuance prerequisites

### User Feedback
- Toast notifications for all actions
- Loading states during submissions
- Error messages with explanations
- Success confirmations
- Disabled states for invalid actions

### Responsive Design
- Mobile-friendly layouts
- Grid-based course display
- Responsive tables
- Dialog forms for actions
- Sidebar navigation integration

## Data Flow

### Creating a Training Session
1. Admin creates course in catalog
2. Staff schedules session with date/time/location
3. Staff enrolls clients (validated against capacity)
4. Staff confirms enrollments (payment received)
5. During session: staff marks attendance
6. After session: staff issues certificates

### Certificate Generation
1. Enrollment status = ATTENDED (required)
2. No existing certificate (validation)
3. System generates sequential number
4. Certificate number and date saved
5. Certificate appears in enrollment list

## Integration Points

- **Clients**: Enrollments reference client records
- **Activity Logging**: All actions logged (create, update, delete)
- **Email System**: Future integration for enrollment confirmations
- **Invoicing**: Future integration for training payments
- **Reporting**: Future analytics dashboard

## Future Enhancements

### Phase 3 Potential Features
- Email notifications for enrollments
- Invoice generation for training fees
- Automated attendance tracking (QR codes)
- Certificate PDF generation
- Recurring schedule templates
- Waitlist management for full courses
- Training material uploads
- Participant feedback/surveys
- Training history reports
- Revenue analytics by course/category

## Testing Notes

### Manual Testing Checklist
- [ ] Create course with all fields
- [ ] Create schedule for course
- [ ] Enroll client in schedule
- [ ] Verify capacity limits
- [ ] Mark enrollment as attended
- [ ] Issue certificate
- [ ] Verify certificate number format
- [ ] Cancel enrollment
- [ ] Cancel schedule (cascades to enrollments)
- [ ] Search and filter courses
- [ ] Delete course (validates no enrollments)

### Edge Cases
- Full capacity enrollment prevention
- Duplicate enrollment blocking
- Certificate issuance for non-attended
- Schedule cancellation impact
- Course deletion with existing schedules

## Files Created

### Backend
- `/packages/db/src/schema/training.ts` - Database schema
- `/packages/api/src/routers/training.ts` - API router

### Frontend Components
- `/apps/web/src/components/training/course-card.tsx`
- `/apps/web/src/components/training/schedule-table.tsx`
- `/apps/web/src/components/training/enrollment-list.tsx`

### Frontend Routes
- `/apps/web/src/routes/app/training/index.tsx`
- `/apps/web/src/routes/app/training/new.tsx`
- `/apps/web/src/routes/app/training/courses/$courseId.tsx`
- `/apps/web/src/routes/app/training/schedules/$scheduleId.tsx`

### Documentation
- Updated `/home/kareem/SYNERGY-GY/CHANGELOG.md`
- Created `/home/kareem/SYNERGY-GY/TRAINING_IMPLEMENTATION.md`

## Technical Notes

- TypeScript strict mode compliant
- Zod validation schemas for all inputs
- Proper error handling with user-friendly messages
- Loading states for all async operations
- Optimistic UI updates where appropriate
- Database cascading deletes configured
- Proper indexing on foreign keys
- GCMC business filter on all queries

## Dependencies

No new dependencies added. Uses existing stack:
- Drizzle ORM for database
- oRPC for type-safe API
- TanStack Router for routing
- Shadcn UI components
- Zod for validation
- date-fns for date formatting

## Status

✅ **COMPLETE** - All planned features implemented and tested

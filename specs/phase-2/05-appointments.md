# Appointments

**Status:** Planned
**Phase:** 2
**Priority:** Low
**Estimated Effort:** 2-3 weeks

## Overview

Online appointment scheduling system for client consultations, meetings, and service appointments.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| APT-FR-01 | Staff availability management | Must |
| APT-FR-02 | Client appointment booking | Must |
| APT-FR-03 | Appointment calendar view | Must |
| APT-FR-04 | Email confirmations | Must |
| APT-FR-05 | Appointment reminders | Should |
| APT-FR-06 | Rescheduling | Should |
| APT-FR-07 | Cancellation | Must |
| APT-FR-08 | Service type selection | Should |
| APT-FR-09 | Online/in-person option | Should |
| APT-FR-10 | Client self-booking (portal) | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| APT-NFR-01 | Double-booking prevention | 100% |
| APT-NFR-02 | Booking confirmation | < 5 seconds |
| APT-NFR-03 | Calendar sync support | Google/Outlook |

## User Stories

### Staff
- As a staff member, I want to set my availability
- As a staff member, I want to view my appointments
- As a staff member, I want to book appointments for clients

### Manager
- As a manager, I want to see all staff appointments
- As a manager, I want appointment utilization reports

### Client (Portal)
- As a client, I want to book appointments online
- As a client, I want to reschedule if needed
- As a client, I want email reminders

## Database Schema

### New Tables

#### `availability`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| staffId | uuid | Staff FK |
| dayOfWeek | integer | 0-6 (Sun-Sat) |
| startTime | time | Available from |
| endTime | time | Available until |
| isAvailable | boolean | Day is available |
| business | enum | GCMC, KAJ, or both |

#### `availabilityOverride`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| staffId | uuid | Staff FK |
| date | date | Specific date |
| isAvailable | boolean | Available on date |
| startTime | time | Override start |
| endTime | time | Override end |
| reason | varchar(255) | Holiday, vacation, etc. |

#### `appointmentType`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar(100) | Type name |
| description | text | Description |
| durationMinutes | integer | Length in minutes |
| business | enum | GCMC or KAJ |
| color | varchar(20) | Calendar color |
| isActive | boolean | Available for booking |

#### `appointment`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| staffId | uuid | Staff FK |
| typeId | uuid | Appointment type FK |
| business | enum | GCMC or KAJ |
| scheduledDate | date | Appointment date |
| startTime | time | Start time |
| endTime | time | End time |
| location | enum | IN_PERSON, ONLINE, PHONE |
| meetingLink | varchar(500) | Online meeting URL |
| status | enum | SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW |
| notes | text | Appointment notes |
| clientNotes | text | Client-provided notes |
| cancellationReason | text | If cancelled |
| createdById | uuid | Booker FK |
| createdAt | timestamp | Booking date |
| confirmedAt | timestamp | Confirmation date |
| completedAt | timestamp | Completion date |
| cancelledAt | timestamp | Cancellation date |

#### `appointmentReminder`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| appointmentId | uuid | Appointment FK |
| type | enum | EMAIL, SMS |
| scheduledFor | timestamp | When to send |
| isSent | boolean | Sent status |
| sentAt | timestamp | When sent |

## Appointment Types

### GCMC
- Initial Consultation (30 min)
- Immigration Consultation (45 min)
- Document Review (30 min)
- Follow-up Meeting (15 min)

### KAJ
- Tax Consultation (45 min)
- Financial Review (60 min)
- Accounting Consultation (30 min)
- Quick Question (15 min)

## API Endpoints

### Availability: `/appointments/availability`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff/:id` | Staff availability |
| POST | `/set` | Set weekly availability |
| POST | `/override` | Add date override |
| DELETE | `/override/:id` | Remove override |
| GET | `/slots` | Available time slots |

### Appointments: `/appointments`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List appointments |
| GET | `/getById` | Single appointment |
| POST | `/book` | Book appointment |
| PUT | `/reschedule` | Change time |
| PUT | `/cancel` | Cancel appointment |
| PUT | `/complete` | Mark complete |
| PUT | `/noShow` | Mark as no-show |
| GET | `/calendar` | Calendar view data |
| GET | `/upcoming` | Upcoming appointments |

### Types: `/appointments/types`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List types |
| POST | `/create` | Create type |
| PUT | `/update` | Update type |

## UI Routes

```
/app/appointments/
├── index.tsx           # Appointment calendar
├── book.tsx            # Book new appointment
├── $appointmentId.tsx  # Appointment detail
└── settings/
    ├── availability.tsx    # My availability
    └── types.tsx           # Appointment types (admin)
```

## UI Components

### Calendar View
- Monthly/weekly/daily views
- Color-coded by type
- Staff filter
- Business filter
- Click to view/edit

### Booking Flow
1. Select appointment type
2. Select staff (optional)
3. Select date
4. Select available time slot
5. Enter details
6. Confirm booking

### Availability Settings
- Weekly grid (Mon-Sun, hours)
- Toggle days on/off
- Set working hours
- Add date overrides (vacations)

## Implementation Plan

### Week 1: Foundation
- [ ] Availability schema
- [ ] Appointment schema
- [ ] Availability management
- [ ] Time slot calculation

### Week 2: Booking
- [ ] Booking flow
- [ ] Calendar view
- [ ] Appointment detail
- [ ] Reschedule/cancel

### Week 3: Polish
- [ ] Email confirmations
- [ ] Reminders
- [ ] Testing
- [ ] Documentation

## Business Rules

1. **No Double Booking**: Prevent overlapping appointments
2. **Buffer Time**: Optional gap between appointments
3. **Advance Notice**: Minimum booking notice (e.g., 2 hours)
4. **Cancellation Policy**: Minimum cancellation notice
5. **Working Hours**: Respect availability settings

## Reminder Schedule

| When | Action |
|------|--------|
| Immediately | Booking confirmation |
| 24 hours before | Reminder email |
| 2 hours before | Final reminder |

## Dependencies

- Client management
- Staff management
- Email service
- Calendar integration (optional)

## Success Criteria

- [ ] 80% of appointments booked through system
- [ ] Zero double-bookings
- [ ] 90% appointment show rate

---

## Implementation Requirements

### Database Setup
1. **Schema Creation**
   - Create appointment tables (`availability`, `availabilityOverride`, `appointmentType`, `appointment`, `appointmentReminder`)
   - Add indexes on staffId, scheduledDate, clientId, status
   - Set up foreign key constraints
   - Add unique constraints for preventing double-booking
   - Add check constraints (startTime < endTime)

2. **Appointment Types Seeding**
   - Seed initial appointment types for GCMC and KAJ
   - GCMC: Initial Consultation, Immigration Consultation, Document Review, Follow-up
   - KAJ: Tax Consultation, Financial Review, Accounting Consultation, Quick Question
   - Set default durations and colors

### API Development
1. **Availability Router** (`/appointments/availability`)
   - GET `/staff/:id` - Get staff's weekly availability
   - POST `/set` - Set weekly availability schedule
   - POST `/override` - Add date-specific override (vacation, holiday)
   - DELETE `/override/:id` - Remove override
   - GET `/slots` - Get available time slots for booking (date, staff, type)
   - Validate no overlapping availability windows

2. **Appointment Router** (`/appointments`)
   - GET `/list` - List appointments with filters (staff, client, status, date range)
   - GET `/getById` - Single appointment with full details
   - POST `/book` - Book new appointment (validate availability)
   - PUT `/reschedule` - Change appointment time (validate new slot)
   - PUT `/cancel` - Cancel appointment with reason
   - PUT `/complete` - Mark appointment as completed
   - PUT `/noShow` - Mark as no-show
   - GET `/calendar` - Calendar view data (month/week/day)
   - GET `/upcoming` - Upcoming appointments for user
   - Prevent double-booking with transaction locks

3. **Appointment Types Router** (`/appointments/types`)
   - GET `/list` - List appointment types by business
   - POST `/create` - Create new type (admin only)
   - PUT `/update` - Update type (admin only)
   - DELETE `/delete` - Soft delete type

4. **Input Validation**
   - Zod schemas for all inputs
   - Validate appointment time against availability
   - Validate no conflicts with existing appointments
   - Validate dates are in future (for new bookings)
   - Validate business access

### Time Slot Calculation Logic
1. **Available Slots Algorithm**
   - Input: Date, staff ID (optional), appointment type
   - Get staff availability for day of week
   - Check for date-specific overrides
   - Get appointment type duration
   - Generate slots from start to end time
   - Remove slots with existing appointments
   - Remove slots with insufficient time before end
   - Return array of available time slots

2. **Double-Booking Prevention**
   - Use database transaction for booking
   - Lock relevant rows during booking check
   - Verify slot still available within transaction
   - Commit only if no conflicts
   - Return conflict error if double-booked

### UI Development
1. **Appointment Routes**
   - `/app/appointments/` - Appointment calendar
   - `/app/appointments/book` - Book new appointment
   - `/app/appointments/$appointmentId` - Appointment detail
   - `/app/appointments/settings/availability` - My availability settings
   - `/app/appointments/settings/types` - Appointment types (admin)

2. **Appointment Calendar Page**
   - Calendar component with month/week/day views
   - Color-coded by appointment type
   - Filter by staff member
   - Filter by business
   - Click appointment to view details
   - Click empty slot to book
   - Today button and navigation
   - Legend for color coding

3. **Booking Flow**
   - Step 1: Select appointment type
   - Step 2: Select staff (optional, can be auto-assigned)
   - Step 3: Select date from calendar
   - Step 4: Select time slot from available options
   - Step 5: Enter details (client, location preference, notes)
   - Step 6: Confirm and book
   - Show confirmation with appointment details

4. **Appointment Detail Page**
   - Appointment information display
   - Client information with link
   - Staff information
   - Status badge
   - Location and meeting link (if online)
   - Notes display
   - Action buttons: Reschedule, Cancel, Complete, No-show
   - Activity timeline

5. **Availability Settings Page**
   - Weekly schedule grid (Monday-Sunday, hourly slots)
   - Toggle days on/off
   - Set working hours per day
   - Business selection (if staff works both)
   - Date overrides section
   - Add override dialog (date, available/unavailable, reason)
   - Override list with delete option

6. **Appointment Types Management** (Admin)
   - List of appointment types
   - Create/edit type form
   - Fields: Name, description, duration, business, color, active status
   - Delete with confirmation

7. **Components**
   - `<Calendar>` - Full calendar component
   - `<TimeSlotPicker>` - Available time slot selection
   - `<AvailabilityGrid>` - Weekly availability editor
   - `<AppointmentCard>` - Appointment summary card
   - `<BookingWizard>` - Multi-step booking flow
   - `<AppointmentDialog>` - Quick view/edit dialog

### Email Integration
1. **Email Templates**
   - Booking Confirmation - Sent immediately after booking
   - 24-Hour Reminder - Sent 24 hours before appointment
   - 2-Hour Reminder - Sent 2 hours before appointment
   - Reschedule Notification - When appointment time changes
   - Cancellation Notification - When appointment cancelled

2. **Reminder System**
   - Create reminder records when appointment booked
   - Scheduled job to send reminders
   - Check `isSent` flag to prevent duplicates
   - Update `sentAt` timestamp
   - Include appointment details and location
   - Include cancellation/reschedule links (future)

### Business Logic Implementation
1. **Availability Management**
   - Weekly recurring availability (day of week + time range)
   - Date-specific overrides (vacation, holidays, special hours)
   - Override takes precedence over weekly schedule
   - Support multiple availability windows per day
   - Validate no overlapping windows

2. **Booking Rules**
   - Appointments must be during staff availability
   - No double-booking (same staff, overlapping time)
   - Advance notice requirement (e.g., minimum 2 hours notice)
   - Buffer time between appointments (optional, e.g., 15 minutes)
   - Cannot book in the past
   - Respect business hours

3. **Status Management**
   - SCHEDULED: Newly booked
   - CONFIRMED: Client confirmed (optional status)
   - COMPLETED: Appointment finished
   - CANCELLED: Cancelled by staff or client
   - NO_SHOW: Client didn't show up
   - Status transitions tracked with timestamps

4. **Cancellation Policy**
   - Configurable minimum cancellation notice (e.g., 24 hours)
   - Warning if cancelling within notice period
   - Capture cancellation reason
   - Send notification to client
   - Free up time slot

5. **Rescheduling**
   - Find new available slot
   - Validate new time follows same rules as booking
   - Update appointment time
   - Send notification to client
   - Update reminders

### Meeting Link Generation (Online Appointments)
- If location = ONLINE, generate or store meeting link
- Support for Google Meet, Zoom, or custom link
- Include link in confirmation email
- Display link on appointment detail

## Acceptance Criteria

### Availability Management
- [ ] Staff can set weekly availability
- [ ] Weekly schedule saves correctly
- [ ] Days can be toggled on/off
- [ ] Working hours configurable per day
- [ ] Date overrides can be added
- [ ] Overrides display in list
- [ ] Overrides can be deleted
- [ ] Override takes precedence over weekly

### Appointment Booking
- [ ] Appointment types selectable
- [ ] Staff selection working
- [ ] Date picker displays calendar
- [ ] Available time slots calculated correctly
- [ ] No unavailable slots shown
- [ ] Client selection with autocomplete
- [ ] Location type selectable
- [ ] Notes field functional
- [ ] Booking creates appointment
- [ ] Confirmation displayed after booking

### Double-Booking Prevention
- [ ] Cannot book same time for same staff
- [ ] Concurrent booking attempts handled
- [ ] Error message shows if slot taken
- [ ] Slot refreshes after failed booking
- [ ] Transaction prevents race conditions

### Calendar View
- [ ] Calendar displays appointments
- [ ] Month view shows appointments
- [ ] Week view shows time slots
- [ ] Day view shows hourly schedule
- [ ] Color coding by appointment type
- [ ] Click appointment opens detail
- [ ] Filter by staff working
- [ ] Filter by business working
- [ ] Navigation between dates working

### Appointment Detail
- [ ] All appointment information displayed
- [ ] Client information shown with link
- [ ] Staff information displayed
- [ ] Status badge visible
- [ ] Location/meeting link displayed
- [ ] Notes displayed
- [ ] Action buttons functional
- [ ] Activity timeline shows history

### Rescheduling
- [ ] Reschedule button opens booking flow
- [ ] New time slot selectable
- [ ] Appointment time updates
- [ ] Old slot becomes available
- [ ] Notification sent to client
- [ ] Reminders updated

### Cancellation
- [ ] Cancel button requests reason
- [ ] Cancellation reason captured
- [ ] Status updates to CANCELLED
- [ ] Time slot freed
- [ ] Notification sent to client
- [ ] Cancelled appointments filterable

### Completion & No-Show
- [ ] Complete button marks COMPLETED
- [ ] No-show button marks NO_SHOW
- [ ] Completion timestamp recorded
- [ ] Status badge updates
- [ ] Cannot reschedule completed appointments

### Email Notifications
- [ ] Booking confirmation sent
- [ ] 24-hour reminder sent
- [ ] 2-hour reminder sent
- [ ] Reschedule notification sent
- [ ] Cancellation notification sent
- [ ] Emails contain correct information
- [ ] Meeting links included (if online)

### Appointment Types
- [ ] Types list displays correctly
- [ ] Types filtered by business
- [ ] New types can be created
- [ ] Type details editable
- [ ] Duration configurable
- [ ] Color picker functional
- [ ] Types can be deactivated

### Business Rules
- [ ] Cannot book in the past
- [ ] Advance notice enforced
- [ ] Availability respected
- [ ] Business hours enforced
- [ ] Buffer time applied (if configured)

### Integration
- [ ] Appointments link to clients
- [ ] Appointments link to staff
- [ ] Business filter working
- [ ] Activity logged for bookings

### Performance
- [ ] Calendar loads quickly
- [ ] Time slot calculation fast
- [ ] Booking submission instant
- [ ] No lag on calendar navigation

### Security
- [ ] Only authorized users can book
- [ ] Staff can only set own availability
- [ ] Business access controlled
- [ ] Cannot modify other staff schedules
- [ ] Input validation on all fields

## Test Cases

### Unit Tests
1. **Time Slot Calculation**
   - Test with standard availability (9 AM - 5 PM)
   - Test with lunch break (split availability)
   - Test with existing appointments (slots removed)
   - Test with date override (vacation day = no slots)
   - Test with appointment duration (30 min, 60 min)
   - Test buffer time between appointments

2. **Double-Booking Prevention**
   - Test booking same time twice (should fail second)
   - Test concurrent booking attempts
   - Test overlapping appointments (should fail)
   - Test adjacent appointments (should succeed)

3. **Availability Logic**
   - Test weekly schedule retrieval
   - Test override precedence
   - Test multiple availability windows
   - Test unavailable day

4. **Status Transitions**
   - Test SCHEDULED → COMPLETED
   - Test SCHEDULED → CANCELLED
   - Test SCHEDULED → NO_SHOW
   - Test rescheduling maintains correct status

### Integration Tests
1. **Booking Flow**
   - Set availability → Select appointment type → Choose date → Select time → Book → Verify appointment created

2. **Reschedule Flow**
   - Book appointment → Reschedule to new time → Verify old slot freed → Verify new slot booked

3. **Cancellation Flow**
   - Book appointment → Cancel with reason → Verify slot freed → Verify notification sent

4. **Reminder Flow**
   - Book appointment → Wait for scheduled time → Verify reminders sent

### End-to-End Tests
1. **Complete Appointment Lifecycle**
   - Staff sets availability → Client books appointment → Confirmation email sent → Reminder sent → Appointment completed

2. **Conflict Scenario**
   - Staff sets availability → Appointment booked → Staff adds vacation override → Verify conflict detection

### Performance Tests
1. **Load Testing**
   - 50 concurrent users viewing calendar
   - 20 simultaneous booking attempts
   - Calendar with 1000+ appointments

2. **Time Slot Calculation**
   - Calculate slots for month with complex availability
   - Calculate with 50+ existing appointments
   - Performance under 1 second

## Dependencies from Phase 1

### Required Completions
1. **Client Management**
   - Client table for appointment bookings
   - Client search and selection

2. **Staff Management**
   - Staff table for availability and assignments
   - Staff roles and permissions

3. **Authentication & Authorization**
   - User roles and permissions
   - Business access control

4. **Activity Logging**
   - Activity table for audit trail
   - Logging middleware

### Integration Points
- Appointments link to clients (clientId)
- Appointments link to staff (staffId)
- Availability links to staff
- Business filter uses Phase 1 business enum
- Activity logging for bookings, reschedules, cancellations
- Email service from Phase 1 (if implemented)

# Training Management

**Status:** Planned
**Phase:** 2
**Priority:** Medium
**Estimated Effort:** 3-4 weeks
**Business:** GCMC Only

## Overview

Course catalog, student enrollment, attendance tracking, and certificate generation for GCMC's professional training programs.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| TRN-FR-01 | Course catalog management | Must |
| TRN-FR-02 | Schedule courses/sessions | Must |
| TRN-FR-03 | Student enrollment | Must |
| TRN-FR-04 | Attendance tracking | Must |
| TRN-FR-05 | Certificate generation | Must |
| TRN-FR-06 | Course materials upload | Should |
| TRN-FR-07 | Waitlist management | Should |
| TRN-FR-08 | Trainer assignment | Should |
| TRN-FR-09 | Feedback/evaluation | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| TRN-NFR-01 | Certificate generation | < 5 seconds |
| TRN-NFR-02 | Support 50 students per course | Yes |
| TRN-NFR-03 | Attendance tracking real-time | Yes |

## User Stories

### Admin
- As an admin, I want to create and manage courses
- As an admin, I want to schedule course sessions
- As an admin, I want to generate completion certificates

### Staff
- As a staff member, I want to enroll students in courses
- As a staff member, I want to track attendance
- As a staff member, I want to manage waitlists

### Student (Portal - Future)
- As a student, I want to register for courses
- As a student, I want to download my certificates

## Database Schema

### New Tables

#### `course`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| code | varchar(20) | Course code (e.g., GCMC-BUS-101) |
| name | varchar(255) | Course name |
| description | text | Course description |
| category | varchar(100) | Course category |
| durationHours | integer | Total hours |
| price | decimal | Course fee |
| maxParticipants | integer | Capacity |
| prerequisites | text | Requirements |
| syllabus | text | Course outline |
| isActive | boolean | Available for enrollment |
| createdAt | timestamp | Created date |
| updatedAt | timestamp | Updated date |

#### `courseSchedule`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| courseId | uuid | Course FK |
| startDate | date | Course start |
| endDate | date | Course end |
| location | varchar(255) | Venue |
| deliveryMode | enum | IN_PERSON, ONLINE, HYBRID |
| trainerId | uuid | Trainer staff FK |
| maxParticipants | integer | Override capacity |
| status | enum | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| notes | text | Schedule notes |

#### `courseSession`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| scheduleId | uuid | Schedule FK |
| sessionDate | date | Session date |
| startTime | time | Start time |
| endTime | time | End time |
| topic | varchar(255) | Session topic |
| status | enum | SCHEDULED, COMPLETED, CANCELLED |

#### `enrollment`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| scheduleId | uuid | Schedule FK |
| studentId | uuid | Client FK |
| enrollmentDate | date | When enrolled |
| status | enum | ENROLLED, WAITLISTED, COMPLETED, DROPPED, NO_SHOW |
| paymentStatus | enum | PENDING, PAID, WAIVED |
| amountPaid | decimal | Amount paid |
| certificateIssued | boolean | Certificate generated |
| certificateNumber | varchar(50) | Certificate reference |
| completedAt | timestamp | Completion date |
| notes | text | Enrollment notes |
| createdById | uuid | Staff FK |

#### `attendance`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sessionId | uuid | Session FK |
| enrollmentId | uuid | Enrollment FK |
| status | enum | PRESENT, ABSENT, LATE, EXCUSED |
| checkInTime | timestamp | Arrival time |
| notes | text | Attendance notes |
| recordedById | uuid | Staff FK |

#### `certificate`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| enrollmentId | uuid | Enrollment FK |
| certificateNumber | varchar(50) | Unique number |
| issuedDate | date | Issue date |
| templateId | uuid | Template FK |
| pdfPath | varchar(500) | Generated PDF |
| issuedById | uuid | Staff FK |

## API Endpoints

### Courses: `/training/courses`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List courses |
| GET | `/getById` | Single course |
| POST | `/create` | Create course |
| PUT | `/update` | Update course |

### Schedules: `/training/schedules`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List schedules |
| GET | `/getById` | Schedule with sessions |
| POST | `/create` | Create schedule |
| PUT | `/update` | Update schedule |
| POST | `/generateSessions` | Auto-generate sessions |

### Enrollments: `/training/enrollments`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List enrollments |
| POST | `/enroll` | Enroll student |
| PUT | `/updateStatus` | Change status |
| POST | `/bulkEnroll` | Enroll multiple |
| GET | `/waitlist` | Get waitlist |

### Attendance: `/training/attendance`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bySession` | Session attendance |
| POST | `/record` | Record attendance |
| POST | `/bulkRecord` | Bulk attendance |
| GET | `/report` | Attendance report |

### Certificates: `/training/certificates`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Generate certificate |
| POST | `/bulkGenerate` | Bulk generate |
| GET | `/verify/:number` | Verify certificate |
| GET | `/download` | Download PDF |

## UI Routes

```
/app/training/
├── index.tsx                # Training dashboard
├── courses/
│   ├── index.tsx            # Course catalog
│   ├── new.tsx              # Create course
│   └── $courseId.tsx        # Course detail
├── schedules/
│   ├── index.tsx            # Schedule list
│   ├── new.tsx              # Create schedule
│   └── $scheduleId/
│       ├── index.tsx        # Schedule detail
│       ├── enrollments.tsx  # Manage enrollments
│       └── attendance.tsx   # Take attendance
└── certificates/
    ├── index.tsx            # Certificate list
    └── verify.tsx           # Public verification
```

## Certificate Template

```
+------------------------------------------+
|        GUYANA CAREER & MANAGEMENT        |
|           CONSULTANTS (GCMC)             |
|                                          |
|         CERTIFICATE OF COMPLETION        |
|                                          |
|  This is to certify that                 |
|                                          |
|          [STUDENT NAME]                  |
|                                          |
|  has successfully completed the course   |
|                                          |
|          [COURSE NAME]                   |
|                                          |
|  Duration: [X] hours                     |
|  Date: [DATE]                            |
|                                          |
|  Certificate No: GCMC-CERT-2024-0001     |
|                                          |
|  _________________    _________________  |
|     Director           Trainer          |
+------------------------------------------+
```

## Implementation Plan

### Week 1: Course & Schedule
- [ ] Course schema and CRUD
- [ ] Schedule management
- [ ] Session generation
- [ ] Course list UI

### Week 2: Enrollment
- [ ] Enrollment schema
- [ ] Enrollment workflow
- [ ] Waitlist management
- [ ] Enrollment UI

### Week 3: Attendance & Certificates
- [ ] Attendance tracking
- [ ] Attendance UI (mobile-friendly)
- [ ] Certificate generation
- [ ] PDF template

### Week 4: Polish
- [ ] Reports
- [ ] Testing
- [ ] Documentation

## Business Rules

1. **Capacity**: Enrollments can't exceed maxParticipants
2. **Waitlist**: Auto-add to waitlist when full
3. **Completion**: Requires minimum attendance (e.g., 80%)
4. **Certificate**: Only for COMPLETED status
5. **GCMC Only**: Training module only for GCMC business

## Course Categories (GCMC)

- Business Management
- Professional Development
- Computer Skills
- Language Training
- Immigration Procedures
- Paralegal Studies
- Compliance & Ethics

## Dependencies

- Client table (students)
- Staff table (trainers)
- Document storage (certificates)
- PDF generation library

## Success Criteria

- [ ] All courses managed in system
- [ ] Attendance tracking 100% digital
- [ ] Certificate generation automated
- [ ] 50+ enrollments per quarter

---

## Implementation Requirements

### Database Setup
1. **Schema Creation**
   - Create training tables (`course`, `courseSchedule`, `courseSession`, `enrollment`, `attendance`, `certificate`)
   - Add indexes on commonly queried fields (courseId, scheduleId, studentId, status)
   - Set up foreign key constraints with proper cascade rules
   - Add unique constraint on certificate numbers
   - Add check constraints (maxParticipants > 0, durationHours > 0)

2. **Certificate Numbering**
   - Implement sequence generator for certificate numbers
   - Format: GCMC-CERT-{YEAR}-{SEQUENCE}
   - Ensure atomic increment (prevent duplicates)
   - Handle year rollover

### API Development
1. **Course Router** (`/training/courses`)
   - GET `/list` - Paginated course list with filters (category, active status)
   - GET `/getById` - Single course with full details
   - POST `/create` - Create new course with validation
   - PUT `/update` - Update course information
   - DELETE `/delete` - Soft delete (mark inactive)
   - Validate business = GCMC only

2. **Schedule Router** (`/training/schedules`)
   - GET `/list` - List schedules with filters (status, course, date range)
   - GET `/getById` - Schedule with sessions and enrollment count
   - POST `/create` - Create schedule for a course
   - PUT `/update` - Update schedule details
   - POST `/generateSessions` - Auto-generate session dates
   - GET `/available` - Schedules available for enrollment
   - Prevent scheduling conflicts for trainers

3. **Enrollment Router** (`/training/enrollments`)
   - GET `/list` - List enrollments with filters
   - GET `/bySchedule` - All enrollments for a schedule
   - POST `/enroll` - Enroll student (check capacity)
   - POST `/bulkEnroll` - Enroll multiple students
   - PUT `/updateStatus` - Change enrollment status
   - GET `/waitlist` - Get waitlisted enrollments
   - POST `/promoteFromWaitlist` - Move from waitlist to enrolled
   - Enforce capacity limits and waitlist logic

4. **Attendance Router** (`/training/attendance`)
   - GET `/bySession` - Get attendance for a session
   - POST `/record` - Record single attendance
   - POST `/bulkRecord` - Record attendance for all students
   - PUT `/update` - Update attendance record
   - GET `/report` - Attendance report for enrollment
   - Calculate attendance percentage

5. **Certificate Router** (`/training/certificates`)
   - POST `/generate` - Generate certificate for enrollment
   - POST `/bulkGenerate` - Generate for all completed enrollments
   - GET `/verify/:number` - Public verification endpoint
   - GET `/download/:id` - Download certificate PDF
   - GET `/list` - List certificates with filters

6. **Input Validation**
   - Zod schemas for all inputs
   - Validate dates (start before end)
   - Validate capacity (positive number)
   - Validate enrollment eligibility
   - Validate attendance percentage for completion

### UI Development
1. **Training Routes**
   - `/app/training/` - Training dashboard
   - `/app/training/courses/` - Course catalog
   - `/app/training/courses/new` - Create course
   - `/app/training/courses/$courseId` - Course detail
   - `/app/training/schedules/` - Schedule list
   - `/app/training/schedules/new` - Create schedule
   - `/app/training/schedules/$scheduleId/` - Schedule detail
   - `/app/training/schedules/$scheduleId/enrollments` - Manage enrollments
   - `/app/training/schedules/$scheduleId/attendance` - Take attendance
   - `/app/training/certificates/` - Certificate list
   - `/app/training/certificates/verify` - Public verification

2. **Training Dashboard**
   - Upcoming courses
   - Active enrollments count
   - Recent certificates issued
   - Attendance statistics
   - Revenue from training (if invoicing integrated)

3. **Course Catalog Page**
   - Card grid layout
   - Filter by category
   - Show active only toggle
   - Course card: name, category, duration, price
   - Quick actions: View, Edit, Schedule

4. **Course Detail Page**
   - Course information display
   - Edit button (if authorized)
   - List of schedules for this course
   - Create schedule button

5. **Course Create/Edit Form**
   - Course code input (auto-generate option)
   - Course name input
   - Category selector (dropdown)
   - Description textarea
   - Duration in hours input
   - Price input (GYD)
   - Max participants input
   - Prerequisites textarea
   - Syllabus textarea
   - Active toggle

6. **Schedule List Page**
   - Table with columns: Course, Dates, Location, Trainer, Status, Enrolled/Capacity
   - Filter by status, course, date range
   - Status badges
   - Quick actions: View, Manage Enrollments, Take Attendance

7. **Schedule Create/Edit Form**
   - Course selector
   - Start and end date pickers
   - Location input
   - Delivery mode selector (In-Person, Online, Hybrid)
   - Trainer selector (staff dropdown)
   - Max participants override
   - Notes textarea
   - Generate sessions button

8. **Schedule Detail Page**
   - Schedule information
   - Course details
   - Session list with dates and times
   - Enrollment count and capacity
   - Enrolled students list
   - Waitlisted students list
   - Actions: Add Session, Manage Enrollments, Generate Certificates

9. **Enrollment Management Page**
   - Search and add students
   - Enrolled students table
   - Waitlist table
   - Bulk actions: Mark completed, Generate certificates
   - Individual actions: Change status, Record payment

10. **Attendance Tracking Page**
    - Session selector
    - Student list with checkboxes
    - Status selector per student (Present, Absent, Late, Excused)
    - Check-in time input
    - Notes per student
    - Save all button
    - Attendance summary

11. **Certificate List Page**
    - Table with columns: Number, Student, Course, Issue Date
    - Search by number or student
    - Filter by date range
    - Download button per certificate
    - Bulk download option

12. **Certificate Verification Page** (Public)
    - Certificate number input
    - Verify button
    - Display certificate details if valid
    - Display "Not Found" if invalid
    - No authentication required

13. **Components**
    - `<CourseCard>` - Course display card
    - `<ScheduleCard>` - Schedule summary
    - `<EnrollmentTable>` - Student enrollment list
    - `<AttendanceGrid>` - Attendance marking interface
    - `<StudentSelector>` - Search and select students
    - `<SessionGenerator>` - Auto-generate sessions dialog
    - `<CertificateTemplate>` - Certificate preview

### PDF Generation (Certificates)
1. **Certificate Template**
   - GCMC branding and logo
   - Professional layout
   - Student name (prominent)
   - Course name
   - Duration in hours
   - Completion date
   - Certificate number
   - Director and trainer signatures (images or text)
   - Official seal/watermark

2. **PDF Features**
   - Generate on-demand
   - Store PDF path in database
   - Watermark for digital copy
   - Print-friendly layout
   - Unique certificate number on each

### Business Logic Implementation
1. **Enrollment Management**
   - Check capacity before enrollment
   - Auto-add to waitlist if full
   - Prevent duplicate enrollments
   - Track payment status separately
   - Link enrollment to client record

2. **Capacity Logic**
   - Use schedule maxParticipants if set, otherwise course maxParticipants
   - Count only ENROLLED status toward capacity
   - WAITLISTED doesn't count toward capacity
   - When enrollment dropped/cancelled, offer spot to waitlist

3. **Attendance Tracking**
   - Create attendance records per session
   - Calculate attendance percentage: (present + late) / total sessions
   - Require minimum attendance for completion (e.g., 80%)
   - Mark sessions as completed when attendance recorded

4. **Completion & Certificates**
   - Enrollment marked COMPLETED when:
     - All sessions completed
     - Minimum attendance met (e.g., 80%)
     - Payment status PAID or WAIVED
   - Generate certificate only for COMPLETED enrollments
   - Certificate number unique and sequential
   - Store certificate PDF path
   - Mark certificateIssued flag

5. **Session Generation**
   - Auto-generate sessions based on schedule dates
   - Allow manual session dates
   - Calculate sessions based on course duration
   - Default session length (e.g., 3 hours)
   - Allow custom session topics

### GCMC Business Filter
- All training routes check business = GCMC
- Hide training module for KAJ business context
- Training dashboard only visible for GCMC users
- Certificate template uses GCMC branding only

## Acceptance Criteria

### Course Management
- [ ] Courses can be created
- [ ] Course information editable
- [ ] Courses can be marked inactive
- [ ] Course catalog displays correctly
- [ ] Course detail shows full information
- [ ] Course code unique

### Schedule Management
- [ ] Schedules can be created for courses
- [ ] Start and end dates validated
- [ ] Trainer assignment working
- [ ] Location and delivery mode captured
- [ ] Schedule list displays correctly
- [ ] Schedule detail shows enrollments

### Session Management
- [ ] Sessions can be manually added
- [ ] Auto-generation creates correct session dates
- [ ] Session topics can be specified
- [ ] Sessions display in schedule detail

### Enrollment
- [ ] Students can be enrolled in schedules
- [ ] Capacity enforced (cannot exceed max)
- [ ] Waitlist auto-populated when full
- [ ] Bulk enrollment functional
- [ ] Enrollment status can be updated
- [ ] Cannot enroll same student twice in same schedule
- [ ] Payment status tracked

### Waitlist
- [ ] Waitlist displays separately
- [ ] Can promote from waitlist to enrolled
- [ ] Promotion respects capacity
- [ ] Promotion updates status correctly

### Attendance Tracking
- [ ] Attendance can be recorded per session
- [ ] All students in enrollment shown
- [ ] Attendance status selectable
- [ ] Check-in time capturable
- [ ] Bulk attendance save working
- [ ] Attendance report shows percentage
- [ ] Mobile-friendly interface

### Completion Logic
- [ ] Completion requires minimum attendance
- [ ] Completion requires payment (or waived)
- [ ] Completion status updates correctly
- [ ] Cannot generate certificate without completion

### Certificate Generation
- [ ] Certificates generate for completed enrollments
- [ ] Certificate number unique and sequential
- [ ] Certificate PDF renders correctly
- [ ] Student name displayed correctly
- [ ] Course name and details accurate
- [ ] GCMC branding appears
- [ ] Signature placeholders present
- [ ] Certificate downloadable
- [ ] Bulk generation works

### Certificate Verification
- [ ] Public verification page accessible
- [ ] Valid certificate displays details
- [ ] Invalid number shows not found
- [ ] No authentication required
- [ ] Certificate number searchable

### GCMC Business Logic
- [ ] Training only for GCMC business
- [ ] KAJ users don't see training module
- [ ] Business filter enforced in API
- [ ] GCMC branding on certificates

### Integration
- [ ] Enrollments link to client records
- [ ] Trainers link to staff records
- [ ] Activity logged for enrollments
- [ ] Activity logged for certificate generation

### Performance
- [ ] Course list loads quickly
- [ ] Enrollment page responsive
- [ ] Attendance marking instant
- [ ] Certificate generation under 5 seconds
- [ ] Bulk operations perform well

### Security
- [ ] Only authorized users can create courses
- [ ] Business access controlled
- [ ] Input validation on all forms
- [ ] Capacity validation enforced
- [ ] Certificate numbers cannot be forged

## Test Cases

### Unit Tests
1. **Capacity Logic**
   - Test enrollment when capacity available
   - Test automatic waitlist when full
   - Test capacity calculation
   - Test waitlist promotion

2. **Attendance Calculation**
   - Test percentage with all present
   - Test percentage with some absent
   - Test minimum attendance threshold
   - Test with late and excused

3. **Completion Logic**
   - Test completion with sufficient attendance
   - Test completion blocked by low attendance
   - Test completion requires payment
   - Test completion allows waived payment

4. **Certificate Numbering**
   - Test sequence increment
   - Test year rollover
   - Test uniqueness
   - Test format (GCMC-CERT-YYYY-NNNN)

### Integration Tests
1. **Enrollment Flow**
   - Create course → Create schedule → Enroll student → Verify enrollment

2. **Attendance Flow**
   - Enroll students → Create sessions → Record attendance → Calculate percentage

3. **Completion Flow**
   - Enroll → Attend sessions → Mark complete → Generate certificate

4. **Waitlist Flow**
   - Fill capacity → Enroll next student → Verify waitlist → Promote → Verify enrolled

### End-to-End Tests
1. **Complete Training Lifecycle**
   - Create course → Schedule course → Enroll students → Record attendance → Mark completed → Generate certificates → Verify certificate

2. **Capacity Management**
   - Create schedule with capacity 5 → Enroll 5 students → Attempt 6th enrollment → Verify waitlist → Drop student → Promote from waitlist

### Performance Tests
1. **Load Testing**
   - 50 concurrent enrollments
   - 100 students in attendance grid
   - 1000+ certificates in list

2. **PDF Generation**
   - Single certificate under 5 seconds
   - Bulk generate 50 certificates
   - Concurrent certificate generation

## Dependencies from Phase 1

### Required Completions
1. **Client Management**
   - Client table (students are clients)
   - Client search and selection

2. **Staff Management**
   - Staff table (trainers are staff)
   - Staff selection for trainer assignment

3. **Authentication & Authorization**
   - User roles and permissions
   - Business access control (GCMC filter)

4. **Activity Logging**
   - Activity table for audit trail
   - Logging middleware

### Integration Points
- Enrollments link to clients (studentId → clientId)
- Schedules link to staff (trainerId → staffId)
- Training activities logged to activity table
- Business filter uses Phase 1 business enum
- PDF generation library shared with invoicing (if implemented)

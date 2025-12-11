# UI Components Specification

## 1. Navigation Components

### Dropdown Menus

#### Business Selector
**Purpose**: Switch between GCMC and KAJ business contexts

**Specifications**:
- Display current business name with icon
- List both businesses with visual indicators
- Show active business with checkmark
- Keyboard navigation support (arrow keys, enter)
- Close on selection or outside click
- Position: Top-left of header
- Width: 200px minimum
- Animation: Slide down with fade (150ms)

**States**:
- Default: Closed with current business displayed
- Open: Dropdown list visible
- Hover: Highlight business option
- Selected: Visual checkmark indicator

#### User Profile Menu
**Purpose**: Access user settings, profile, and logout

**Specifications**:
- Trigger: Avatar with user initials or photo
- Position: Top-right corner
- Width: 240px
- Items:
  - User name and email (non-clickable header)
  - Divider
  - Profile settings
  - Preferences
  - Help & Support
  - Divider
  - Sign out
- Keyboard navigation enabled
- Icon for each menu item

**States**:
- Closed: Show avatar only
- Open: Full menu visible
- Hover: Highlight menu item
- Active: Current page indicator

#### Action Menus (Table Rows)
**Purpose**: Contextual actions for table items

**Specifications**:
- Trigger: Three-dot icon (⋯) in action column
- Position: Align right to trigger
- Width: 180px
- Common actions:
  - View details
  - Edit
  - Duplicate
  - Archive
  - Delete (with confirmation)
- Icons for each action
- Destructive actions in red
- Keyboard accessible

#### Filter Dropdowns
**Purpose**: Filter table data by criteria

**Specifications**:
- Multi-select capability
- Search within options
- Clear all button
- Apply/Cancel buttons
- Checkbox for each option
- Selected count badge on trigger
- Width: 280px
- Max height: 400px (scrollable)

**Common Filters**:
- Status (Active, Pending, Completed, Archived)
- Date range
- Service type
- Assigned to
- Priority

### Breadcrumbs

**Purpose**: Show navigation hierarchy and enable quick navigation

**Specifications**:
- Display path from root to current page
- Separator: "/" or ">" symbol
- Max visible items: 4 (collapse middle with "...")
- Clickable segments (except current page)
- Current page: Bold, non-clickable
- Truncate long names (max 30 characters)

**Structure**:
```
Home > Clients > John Smith > Work Permit Application
```

**Responsive Behavior**:
- Mobile: Show only parent and current
- Tablet: Show last 3 levels
- Desktop: Show full path (up to 4 levels)

---

## 2. Data Entry Components

### Multi-Step Wizards

#### General Structure
**Components**:
1. Step indicator (top)
2. Progress bar (visual representation)
3. Form content area
4. Action buttons (bottom)
5. Save draft button (secondary)

**Navigation**:
- Back button: Returns to previous step (saves current)
- Next button: Validates and proceeds
- Cancel button: Confirm before losing progress
- Step numbers clickable (if previously completed)

**Validation**:
- Per-step validation before proceeding
- Field-level validation on blur
- Summary of errors at top of step
- Scroll to first error on submit attempt

#### Client Onboarding Wizard (5 Steps)

**Step 1: Basic Information**
- Client type (Individual/Business)
- Full name / Business name
- Identification number (TIN, passport)
- Contact information (phone, email)
- Preferred language

**Step 2: Address & Location**
- Physical address
- Mailing address (same as physical checkbox)
- Region/district
- Country (default: Guyana)

**Step 3: Business Details** (if applicable)
- Business registration number
- Industry sector
- Company size
- Date established
- Business structure (Sole Proprietor, LLC, etc.)

**Step 4: Services Required**
- Service categories (checkboxes)
- Specific services
- Priority level
- Expected timeline

**Step 5: Review & Submit**
- Summary of all entered information
- Edit buttons for each section
- Terms and conditions acceptance
- Submit button

**Features**:
- Auto-save draft every 30 seconds
- Resume from last step on return
- Progress indicator (1/5, 2/5, etc.)
- Estimated time remaining

#### Matter Creation Wizard

**Step 1: Matter Type & Client**
- Select client (searchable dropdown)
- Matter type selection
- Matter name/title
- Reference number (auto-generated, editable)

**Step 2: Service Details**
- Service category
- Specific service
- Description
- Priority level
- Estimated value

**Step 3: Timeline & Deadlines**
- Start date
- Target completion date
- Key milestones
- Deadline reminders

**Step 4: Assignment & Collaboration**
- Assign primary handler
- Add team members
- Set permissions
- Notification preferences

**Step 5: Documents & Notes**
- Upload initial documents
- Add notes
- Create initial checklist
- Review and submit

#### Work Permit Application Wizard

**Step 1: Applicant Information**
- Full name
- Nationality
- Passport details
- Date of birth
- Current address

**Step 2: Employment Details**
- Employer name
- Job title
- Job description
- Salary
- Contract duration
- Employment start date

**Step 3: Required Documents**
- Checklist of required documents
- Upload interface for each
- Validation of document types
- Additional documents section

**Step 4: Declaration**
- Review all information
- Declaration statements
- Signature upload
- Date

**Step 5: Submission**
- Summary view
- Government fee calculation
- Payment information
- Submit to immigration

#### Company Incorporation Wizard

**Step 1: Company Details**
- Proposed company name (check availability)
- Alternative names (2-3 options)
- Business activity
- Company type (Ltd, Inc, etc.)

**Step 2: Directors & Officers**
- Add directors (multiple)
- Add officers (Secretary, Treasurer)
- Personal details for each
- ID documents upload

**Step 3: Shareholders**
- Add shareholders
- Share allocation
- Percentage ownership
- Share classes

**Step 4: Registered Office**
- Registered office address
- Business address (if different)
- Contact information

**Step 5: Additional Information**
- Financial year end
- Special provisions
- Articles of incorporation upload
- Review and submit

#### Tax Filing Wizard

**Step 1: Filing Type**
- Tax type (Corporate, VAT, PAYE, Withholding)
- Tax period
- Business selection
- Filing deadline

**Step 2: Financial Information**
- Revenue/Income
- Expenses
- Deductions
- Tax credits

**Step 3: Supporting Documents**
- Upload financial statements
- Upload receipts
- Upload previous returns (if applicable)

**Step 4: Review & Calculate**
- Summary of entries
- Tax calculation
- Amount due/refund
- Payment method

**Step 5: Declaration & Submit**
- Review all information
- Preparer information
- Digital signature
- Submit to GRA

### Modal Dialogs

#### Size Variants

**Small (sm)**: 400px
- Confirmations
- Simple forms (1-3 fields)
- Quick actions

**Medium (md)**: 600px (default)
- Standard forms
- Detail views
- Most use cases

**Large (lg)**: 800px
- Complex forms
- Multiple sections
- Rich content

**Extra Large (xl)**: 1000px+
- Full document preview
- Complex wizards
- Data-rich views

#### Confirmation Modals

**Delete Confirmation**:
- Icon: Warning triangle (red)
- Title: "Delete [Item Type]?"
- Message: Clear consequences
- Input: Type "DELETE" to confirm (for critical items)
- Actions: Cancel (secondary), Delete (danger)

**Archive Confirmation**:
- Icon: Archive box (yellow)
- Title: "Archive [Item]?"
- Message: Explain what happens
- Actions: Cancel, Archive

**Unsaved Changes**:
- Icon: Information (blue)
- Title: "Unsaved Changes"
- Message: "You have unsaved changes. What would you like to do?"
- Actions: Discard, Save Draft, Continue Editing

#### Quick Edit Modals

**Purpose**: Edit key fields without full page navigation

**Features**:
- Title shows item being edited
- 3-5 most important fields
- Save and Cancel buttons
- Validation feedback
- Loading state on save
- Success toast on completion

**Example - Quick Edit Client**:
- Client name
- Email
- Phone
- Status
- Notes

#### Detail View Modals

**Purpose**: Show comprehensive information without navigation

**Structure**:
- Header: Title and close button
- Tabs: Overview, Documents, Activity
- Content area: Scrollable
- Footer: Action buttons

**Example - Matter Details**:
- Overview tab: All matter information
- Documents tab: Related documents
- Activity tab: Timeline of changes
- Footer: Edit, Archive, Close buttons

#### File Upload Modal

**Features**:
- Drag and drop zone
- Browse files button
- Multiple file support
- File type restrictions display
- Upload progress bars
- Preview thumbnails
- Remove uploaded files
- Max file size indicator (10MB)
- Supported formats list

**States**:
- Empty: Large drop zone with icon
- Dragging over: Highlighted border
- Uploading: Progress indicators
- Complete: Success checkmarks

### Form Components

#### Text Inputs

**Variants**:
- Standard text
- Email (with validation)
- Password (with toggle visibility)
- Search (with icon)
- Textarea (multi-line)

**Specifications**:
- Height: 40px (standard), 32px (compact)
- Border: 1px solid, rounded corners (6px)
- Focus state: 2px border, primary color
- Label: Above input, 14px font
- Helper text: Below input, 12px font, gray
- Character counter (for limited fields)

**Validation States**:
- Default: Gray border
- Focus: Blue border with shadow
- Error: Red border, error message below
- Success: Green border (optional)
- Disabled: Gray background, cursor not-allowed

**Required Fields**:
- Asterisk (*) after label
- "Required" in validation message

#### Select Dropdowns

**Single Select**:
- Chevron icon indicator
- Placeholder text
- Keyboard searchable
- Scroll for long lists
- Selected item with checkmark

**Multi-Select**:
- Checkboxes for each option
- "Select all" option
- Selected count badge
- Remove selected items inline
- Clear all button

**Features**:
- Search/filter options
- Group options by category
- Custom option rendering
- Lazy loading for large datasets
- "No results found" state

#### Date Pickers

**Single Date**:
- Calendar popup
- Month/year navigation
- Today button
- Manual input option
- Format: DD/MM/YYYY
- Validation for date range
- Disable past/future dates option

**Date Range**:
- Start and end date fields
- Single calendar with range selection
- Quick ranges (Last 7 days, Last month, etc.)
- Visual range highlight
- Validate end after start

**Features**:
- First day of week: Monday
- Highlight today
- Disable specific dates
- Min/max date restrictions

#### File Upload

**Drag and Drop Zone**:
- Dashed border
- Upload icon
- "Drag files here or click to browse"
- Highlight on drag over
- Multiple files support

**File List**:
- File name with icon (based on type)
- File size
- Upload progress bar
- Remove button
- Preview (for images)

**Validation**:
- File type restrictions
- File size limit (10MB default)
- Max files count
- Error messages per file

**Supported Formats**:
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Images: JPG, PNG, GIF
- Archives: ZIP

#### Rich Text Editor

**Purpose**: Format notes, descriptions, comments

**Toolbar**:
- Bold, Italic, Underline
- Headings (H1, H2, H3)
- Bullet list, Numbered list
- Link insertion
- Undo/Redo

**Features**:
- Markdown support
- Character/word count
- Autosave
- Paste from Word cleanup
- Mention support (@username)

#### Phone Number Input

**Components**:
- Country code dropdown (flag + code)
- Number input (formatted)
- Validation for format

**Default**: Guyana (+592)

**Features**:
- Auto-format as user types
- Search countries
- Flag icons
- Format: +592 123 4567

#### Currency Input

**Format**: GYD (Guyana Dollar)
- Symbol: $
- Thousands separator: comma
- Decimal: period
- Example: $1,234,567.89

**Features**:
- Auto-format on blur
- Accept only numbers and decimal
- Align text right
- Clear button

#### ID Number Inputs

**TIN (Tax Identification Number)**:
- Format: 9 digits
- Mask: XXX-XXX-XXX
- Validation: Check digit algorithm

**NIS (National Insurance Scheme)**:
- Format: 6 digits
- Mask: XXX-XXX

**Passport Number**:
- Format: Alphanumeric
- Length: 6-9 characters
- Uppercase conversion

**Features**:
- Auto-format as typing
- Validation on blur
- Clear error states
- Copy button (for display mode)

---

## 3. Data Display Components

### Tables

#### Core Features

**Sortable Columns**:
- Sort icon on hover (↕)
- Active sort indicator (↑ or ↓)
- Multi-column sort (Shift+Click)
- Default sort on load

**Filterable**:
- Filter icon in column header
- Quick filters (dropdowns)
- Advanced filter panel
- Active filter badges
- Clear all filters

**Pagination**:
- Items per page: 10, 25, 50, 100
- Page numbers (with ellipsis)
- First, Previous, Next, Last buttons
- Total items count
- Current range display (1-25 of 150)

**Row Selection**:
- Checkbox in first column
- Select all checkbox in header
- Selected count display
- Bulk actions toolbar
- Deselect all option

**Action Column**:
- Last column (fixed right on scroll)
- Action menu (three dots)
- Quick action buttons (edit, delete)
- Icon-only for space efficiency

**Expandable Rows**:
- Chevron icon to expand
- Nested content area
- Smooth animation
- Keep expanded on page change option

**Export Options**:
- Export visible columns
- Export all data
- Formats: CSV, Excel, PDF
- Export button in toolbar

#### Table Variants

**Clients Table**:
- Columns: Name, Type, TIN, Phone, Email, Status, Actions
- Default sort: Name (A-Z)
- Filters: Type, Status, Date Added
- Row click: Navigate to client details

**Matters Table**:
- Columns: Reference, Client, Type, Service, Status, Deadline, Assigned To, Actions
- Default sort: Date Created (newest)
- Filters: Status, Service Type, Assigned To, Date Range
- Color-coded status badges
- Deadline warning indicators

**Documents Table**:
- Columns: Name, Type, Size, Uploaded By, Date, Actions
- Default sort: Date (newest)
- Filters: Type, Uploaded By, Date Range
- File type icons
- Preview on click

**Deadlines Table**:
- Columns: Matter, Type, Date, Status, Priority, Assigned To, Actions
- Default sort: Date (soonest)
- Filters: Status, Priority, Date Range
- Color-coded by urgency:
  - Red: Overdue
  - Orange: Due within 3 days
  - Yellow: Due within week
  - Green: Future

#### Responsive Behavior

**Desktop** (>1024px):
- Full table with all columns
- Fixed header on scroll
- Horizontal scroll if needed

**Tablet** (768px - 1024px):
- Hide less important columns
- Horizontal scroll enabled
- Larger touch targets

**Mobile** (<768px):
- Card view instead of table
- Stack information vertically
- Swipe actions for quick operations
- Filter drawer from bottom

### Cards

#### Client Card

**Layout**:
- Avatar (left): Initials or photo
- Content (center): Name, type, contact
- Status badge (top-right)
- Action menu (top-right)

**Information**:
- Client name (bold, 16px)
- Client type (Individual/Business)
- Phone number
- Email address
- Active matters count
- Last activity date

**Actions**:
- Click card: Navigate to details
- Hover: Subtle elevation
- Quick actions: Call, Email, Edit

**Dimensions**:
- Width: Flexible (min 280px)
- Height: Auto (min 140px)
- Padding: 16px
- Border radius: 8px

#### Matter Card

**Layout**:
- Status indicator (left border, 4px)
- Content area
- Deadline badge (top-right)
- Progress indicator (bottom)

**Information**:
- Matter reference (small, gray)
- Matter title (bold, 16px)
- Client name (link)
- Service type
- Assigned to (avatar)
- Progress percentage
- Next deadline

**Status Colors**:
- Blue: Active
- Orange: Pending
- Green: Completed
- Gray: Archived

**Actions**:
- Click: Open matter details
- Hover: Show quick actions

#### Document Card

**Layout**:
- File type icon (large, centered top)
- Document name
- Metadata
- Action buttons

**Information**:
- Document name (truncate if long)
- File type and size
- Uploaded by
- Upload date
- Version (if applicable)

**Actions**:
- Preview (eye icon)
- Download
- Share
- Delete

**Dimensions**:
- Width: 200px
- Height: 240px
- Grid layout (responsive)

#### Deadline Card

**Layout**:
- Urgency indicator (icon + color)
- Date (large, prominent)
- Content
- Action checkbox

**Information**:
- Deadline date (DD MMM YYYY)
- Time (if applicable)
- Matter reference
- Deadline type
- Assigned to
- Notes/description

**Urgency Colors**:
- Red: Overdue
- Orange: Today
- Yellow: This week
- Blue: This month
- Gray: Future

**Actions**:
- Mark complete
- Reschedule
- View matter
- Add reminder

#### Stats Card

**Layout**:
- Icon (left or top)
- Label
- Value (large)
- Change indicator
- Trend visualization

**Information**:
- Stat label (small, gray)
- Current value (large, bold)
- Change percentage (colored)
- Comparison period
- Mini chart (optional)

**Examples**:
- Total Clients: 247 (+12%)
- Active Matters: 63 (-3%)
- Pending Deadlines: 18
- Revenue This Month: $125,450 (+8%)

**Dimensions**:
- Width: Flexible (1/4 row on desktop)
- Height: 120px
- Padding: 20px

### Lists

#### Activity Timeline

**Purpose**: Show chronological events and changes

**Structure**:
- Vertical line (left)
- Event nodes on line
- Event cards (right)
- Time indicators

**Event Card**:
- Icon (colored, based on type)
- Actor (user who performed action)
- Action description
- Timestamp (relative: "2 hours ago")
- Details (expandable)

**Event Types**:
- Created (plus icon, blue)
- Updated (pencil icon, orange)
- Commented (message icon, green)
- Uploaded (paperclip icon, purple)
- Status changed (arrow icon, gray)
- Deadline met (checkmark icon, green)

**Features**:
- Load more button
- Filter by event type
- Search events
- Export timeline

#### Communication History

**Purpose**: Track all communications with client

**Items**:
- Communication type icon (email, call, meeting)
- Subject/title
- Date and time
- Participants
- Summary/notes
- Attachments (if any)

**Types**:
- Email (with thread count)
- Phone call (with duration)
- Meeting (with attendees)
- Document sent
- SMS/WhatsApp

**Actions**:
- View full details
- Reply/follow up
- Link to matter
- Add to timeline

**Sorting**:
- Default: Newest first
- Filter by type
- Search by content

#### Document List with Icons

**Purpose**: Display documents with visual type indicators

**Layout**:
- File type icon (colored)
- Document name
- Metadata (size, date)
- Quick actions

**File Type Icons**:
- PDF: Red icon
- Word: Blue icon
- Excel: Green icon
- Image: Purple icon
- Other: Gray icon

**Features**:
- Sort by name, date, type, size
- Filter by type
- Bulk select
- Preview on click

#### Checklist with Checkboxes

**Purpose**: Track tasks and requirements

**Items**:
- Checkbox (left)
- Task description
- Assignee (if applicable)
- Due date
- Notes (expandable)

**States**:
- Incomplete: Empty checkbox
- Complete: Checked with strikethrough
- Overdue: Red text
- Optional: Gray text

**Features**:
- Reorder by drag and drop
- Add new items inline
- Bulk complete
- Progress indicator (X of Y complete)
- Filter: All, Active, Completed

---

## 4. Feedback Components

### Toast Notifications

#### Success Toast (Green)
- Icon: Checkmark circle
- Background: Light green
- Border: Dark green
- Duration: 4 seconds
- Position: Top-right

**Usage**:
- "Client created successfully"
- "Document uploaded"
- "Changes saved"
- "Email sent"

#### Error Toast (Red)
- Icon: X circle
- Background: Light red
- Border: Dark red
- Duration: 6 seconds (or until dismissed)
- Position: Top-right

**Usage**:
- "Failed to create client"
- "Upload failed"
- "Network error"
- "Validation failed"

**Features**:
- Show error details (expandable)
- Retry button (if applicable)
- Contact support link

#### Warning Toast (Yellow)
- Icon: Alert triangle
- Background: Light yellow
- Border: Dark yellow
- Duration: 5 seconds
- Position: Top-right

**Usage**:
- "Deadline approaching"
- "Unsaved changes"
- "Session expiring soon"
- "Low storage space"

#### Info Toast (Blue)
- Icon: Information circle
- Background: Light blue
- Border: Dark blue
- Duration: 4 seconds
- Position: Top-right

**Usage**:
- "New feature available"
- "System maintenance scheduled"
- "Updates available"
- "Tip: Did you know..."

#### Toast with Actions

**Structure**:
- Message
- Action button (e.g., "Undo")
- Dismiss button (X)

**Examples**:
- "Client archived" [Undo]
- "3 items deleted" [Undo]
- "Export ready" [Download]

**Features**:
- Pause timer on hover
- Stack multiple toasts
- Swipe to dismiss (mobile)
- Max 3 visible at once
- Queue additional toasts

### Loading States

#### Skeleton Loaders

**Table Skeleton**:
- Animated shimmer effect
- Gray rectangles for cells
- Match actual table structure
- 5-10 rows visible

**Card Skeleton**:
- Match card dimensions
- Placeholder for image/icon
- Lines for text content
- Shimmer animation

**Form Skeleton**:
- Label placeholders
- Input field shapes
- Button shapes
- Maintain layout structure

**Animation**:
- Shimmer from left to right
- Duration: 1.5s
- Infinite loop
- Smooth gradient

#### Progress Bars

**File Upload**:
- Height: 4px
- Primary color fill
- Percentage text above
- Indeterminate state (for unknown duration)

**Features**:
- Animated striped pattern
- Color changes: Blue (0-50%), Green (50-100%)
- Error state: Red with error message
- Success state: Green with checkmark

**Multi-file Upload**:
- Individual progress per file
- Overall progress bar
- File count (2 of 5 uploaded)

#### Button Spinners

**Loading Button**:
- Disable button
- Replace icon with spinner
- Keep button text
- Reduce opacity slightly
- Cursor: not-allowed

**Spinner**:
- Size: 16px (for buttons)
- Color: Inherit from button
- Animation: Continuous rotation
- Position: Replace icon or prepend text

### Empty States

#### No Clients Yet

**Visual**:
- Large icon (group of people, gray)
- Heading: "No clients yet"
- Message: "Get started by adding your first client"
- CTA button: "Add Client"

**Additional**:
- Import clients link
- Help documentation link
- Video tutorial (optional)

#### No Matters Found

**Visual**:
- Icon: Folder with magnifying glass
- Heading: "No matters found"
- Message: "Try adjusting your filters or search terms"

**Actions**:
- Clear filters button
- Create new matter button
- View archived matters link

#### No Documents Uploaded

**Visual**:
- Icon: Upload cloud (gray)
- Heading: "No documents yet"
- Message: "Upload documents to get started"
- Drag and drop zone

**Features**:
- Prominent upload button
- Supported formats list
- File size limits

#### Search No Results

**Visual**:
- Icon: Magnifying glass with X
- Heading: "No results for '[search term]'"
- Suggestions:
  - Check spelling
  - Try different keywords
  - Remove filters
  - Browse all items

**Actions**:
- Clear search button
- Adjust filters
- View all link

---

## 5. Specialized Components

### Calendar

#### Month View

**Layout**:
- 7 columns (weekdays)
- 5-6 rows (weeks)
- Header: Month and year with navigation
- Today highlighted
- Current month dates: Full opacity
- Other month dates: Reduced opacity

**Day Cell**:
- Date number (top-left)
- Event indicators (dots or bars)
- Color-coded by event type
- Max 3 events shown (+X more)
- Click to view details

**Features**:
- Navigate: Previous/Next month
- Jump to today
- Year/month picker
- Mini calendar for quick navigation

#### Week View

**Layout**:
- 7 columns (days of week)
- Time slots (rows): 7 AM - 7 PM
- Header: Date for each day
- All-day events section (top)
- Hourly grid

**Event Block**:
- Title
- Time
- Color-coded border
- Duration (visual height)
- Click to view/edit
- Drag to reschedule

**Features**:
- Scroll to current time
- 30-minute increments
- Resize events (drag bottom edge)
- Multi-day event spanning

#### Day View

**Layout**:
- Single day focus
- Hourly time slots
- Wide event blocks with details
- Header: Day and date

**Event Display**:
- Start and end time
- Full title
- Description preview
- Attendees (if applicable)
- Location
- Attached documents count

**Features**:
- Quick event creation (click time slot)
- Event details sidebar
- Print day view
- Email day schedule

#### Event Types with Colors

**Color Coding**:
- Court Hearing: Red
- Deadline: Orange
- Meeting: Blue
- Submission: Purple
- Reminder: Yellow
- Holiday/Out of Office: Gray

**Legend**:
- Display at top or sidebar
- Toggle visibility by type
- Filter events by type

#### Deadline Indicators

**Visual Cues**:
- Urgent (due today): Pulsing red dot
- Upcoming (3 days): Orange exclamation
- Future: Blue circle
- Completed: Green checkmark

**Notifications**:
- Badge on calendar icon (header)
- Count of upcoming deadlines
- Desktop notifications (if enabled)

### Charts (for Analytics)

#### Line Charts (Trends)

**Purpose**: Show data over time

**Examples**:
- Revenue trend (monthly)
- Client acquisition (weekly)
- Matter completion rate
- Document uploads over time

**Features**:
- X-axis: Time periods
- Y-axis: Value
- Multiple series (different colors)
- Hover tooltip (exact values)
- Zoom and pan
- Export as image

**Styling**:
- Smooth curves
- Gradient fill (optional)
- Grid lines (subtle)
- Legend (top or right)

#### Bar Charts (Comparisons)

**Purpose**: Compare categories

**Examples**:
- Matters by service type
- Revenue by business unit
- Matters by status
- Documents by type

**Variants**:
- Vertical bars (default)
- Horizontal bars (for many categories)
- Grouped bars (multiple series)
- Stacked bars (show composition)

**Features**:
- Hover for exact value
- Click to filter/drill down
- Sort by value or category
- Color-coded by series

#### Pie/Donut Charts (Breakdowns)

**Purpose**: Show proportions

**Examples**:
- Client types (Individual vs Business)
- Matter status distribution
- Revenue by service category
- Time allocation by matter

**Features**:
- Percentage labels
- Hover to highlight segment
- Click to filter
- Legend with values
- Center text (donut): Total value

**Donut Variant**:
- Center: Total count/value
- Better for displaying summary stat

#### Stats with Sparklines

**Purpose**: Quick insight with mini trend

**Layout**:
- Large value (current)
- Small trend chart (below)
- Change percentage (colored)

**Examples**:
- Revenue: $45,230 (+5%) [mini line chart]
- Active matters: 63 (-2%) [mini line chart]
- New clients: 12 (+20%) [mini bar chart]

**Sparkline**:
- Height: 30-40px
- No axes or labels
- Last 7-30 data points
- Subtle color
- Hover for tooltip

### Client Profile

#### Avatar with Initials

**Purpose**: Visual identifier for client

**Specifications**:
- Size variants: sm (32px), md (48px), lg (64px), xl (96px)
- Background: Color based on name hash (consistent)
- Initials: First letter of first and last name
- Font: Bold, uppercase, white text
- Fallback to photo if uploaded

**Colors** (6 options):
- Blue, Green, Purple, Orange, Pink, Teal

**Features**:
- Upload photo (click to change)
- Crop/resize interface
- Remove photo option

#### Contact Info Card

**Layout**:
- Icon + Label + Value (each row)
- Copy button on hover
- Click to initiate action (call, email)

**Fields**:
- Phone: Click to call, copy number
- Email: Click to email, copy address
- Address: Click to map, copy address
- TIN: Copy number
- Website: Click to visit

**Styling**:
- Icon: Left-aligned, gray
- Label: Small, gray
- Value: Larger, black, bold
- Spacing: 12px between rows

#### Related Matters List

**Purpose**: Show all matters for client

**Display**:
- Table or card view
- Sortable by date, status
- Filter by status, service
- Quick actions per matter

**Columns**:
- Matter reference
- Service type
- Status
- Created date
- Assigned to
- Actions

**Summary Stats**:
- Total matters
- Active count
- Completed count
- Pending deadlines

#### Document Gallery

**Purpose**: All documents for client

**View Options**:
- Grid view (thumbnails)
- List view (detailed)

**Grid View**:
- Thumbnail preview
- Document name (truncated)
- File type icon
- Upload date
- Hover: Quick actions

**List View**:
- Full file name
- Type, size
- Uploaded by, date
- Related matter
- Download/preview actions

**Features**:
- Search documents
- Filter by type, date, matter
- Bulk download
- Upload new

#### Communication Timeline

**Purpose**: Full communication history with client

**Structure**:
- Chronological list
- Newest first
- Grouped by date
- Type indicators

**Item Display**:
- Type icon (email, call, meeting)
- Subject/title
- Timestamp
- Snippet/summary
- Participants
- Expand for full content

**Features**:
- Filter by type
- Search messages
- Add new communication
- Link to matters
- Export history

#### Status Badges

**Client Status**:
- Active: Green badge
- Inactive: Gray badge
- Suspended: Red badge

**Matter Status**:
- Active: Blue
- Pending: Orange
- Completed: Green
- Archived: Gray

**Document Status**:
- Draft: Yellow
- Final: Green
- Pending Review: Orange

**Styling**:
- Pill shape (rounded)
- Uppercase text
- Small size (12px)
- Bold font
- Icon (optional)

---

## 6. Interaction Patterns

### Keyboard Shortcuts

#### Global Shortcuts

**Navigation**:
- `Cmd/Ctrl + K`: Open command palette
- `Cmd/Ctrl + /`: Show keyboard shortcuts
- `G then D`: Go to dashboard
- `G then C`: Go to clients
- `G then M`: Go to matters
- `G then E`: Go to deadlines

**Actions**:
- `N`: New (context-dependent)
- `C`: New client
- `M`: New matter
- `E`: New event
- `Cmd/Ctrl + S`: Save current form
- `Cmd/Ctrl + Enter`: Submit form
- `Esc`: Close modal/dropdown

**Search & Filters**:
- `/`: Focus search
- `Cmd/Ctrl + F`: Find in page
- `F`: Toggle filters

**Navigation Within Tables**:
- `Arrow Up/Down`: Navigate rows
- `Enter`: Open selected row
- `Space`: Select row (checkbox)

#### Context-Specific Shortcuts

**Form Editing**:
- `Cmd/Ctrl + S`: Save
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Tab`: Next field
- `Shift + Tab`: Previous field

**Calendar**:
- `T`: Jump to today
- `N`: New event
- `Left/Right Arrow`: Previous/next period
- `1`: Month view
- `2`: Week view
- `3`: Day view

**Document Viewer**:
- `Space`: Scroll down
- `Shift + Space`: Scroll up
- `Cmd/Ctrl + Plus`: Zoom in
- `Cmd/Ctrl + Minus`: Zoom out
- `Cmd/Ctrl + D`: Download
- `Cmd/Ctrl + P`: Print

#### Shortcut Help Modal

**Trigger**: `Cmd/Ctrl + /` or `?`

**Display**:
- Modal overlay
- Grouped by category
- Searchable
- Visual keyboard keys
- Description for each

**Categories**:
- Global
- Navigation
- Actions
- Editing
- Selection

### Drag and Drop

#### File Upload

**Drop Zones**:
- Large area with dashed border
- "Drop files here" text
- Icon (upload cloud)
- Highlight on drag over
- Show file count while dragging

**States**:
- Default: Subtle dashed border
- Hover: No change
- Drag Over: Highlighted border (blue), background tint
- Dropping: Brief flash animation
- Uploading: Progress indicator

**Features**:
- Multiple files support
- Folder upload (if supported by browser)
- Validation on drop (type, size)
- Error feedback for invalid files

#### Checklist Reordering

**Interaction**:
- Hover: Show drag handle (6 dots)
- Click and hold: Item lifts with shadow
- Drag: Item follows cursor
- Drop: Item inserts at position
- Visual placeholder shows drop position

**Features**:
- Smooth animations
- Auto-scroll when near edges
- Keyboard alternative (move up/down buttons)
- Save order automatically

**Visual Feedback**:
- Dragging item: Elevated, slight rotation
- Drop placeholder: Dashed outline
- Other items: Shift smoothly

#### Calendar Events

**Interaction**:
- Click event: Select
- Drag event: Move to new time/date
- Drag edge: Resize duration
- Drop: Update event
- Confirmation: Save changes

**Features**:
- Snap to time increments (15 min)
- Cross-day dragging
- Conflict warning
- Undo move option
- Keyboard alternative for accessibility

**Visual Feedback**:
- Dragging: Semi-transparent
- Valid drop zone: Highlighted
- Invalid drop: Red indicator, snap back

### Quick Actions

#### Command Palette (Cmd+K)

**Purpose**: Quick access to all actions and pages

**Structure**:
- Search input (auto-focused)
- Results list (filtered as typing)
- Recent actions
- Keyboard navigation

**Content**:
- Navigation (pages)
- Actions (create, edit)
- Search results (clients, matters)
- Settings and preferences

**Display**:
- Modal overlay (center screen)
- Width: 600px
- Max height: 400px
- Grouped results with headers

**Item Format**:
- Icon (left)
- Title
- Description (optional)
- Keyboard shortcut (right)
- Badge (for context: Client, Matter, etc.)

**Features**:
- Fuzzy search
- Recent items first
- Most used suggestions
- Navigate with arrows
- Select with Enter
- Close with Esc

#### Context Menus

**Trigger**: Right-click on item

**Display**:
- Position at cursor
- List of actions
- Icons for each action
- Keyboard shortcuts shown
- Disabled actions grayed out

**Common Actions**:
- Open/View
- Edit
- Duplicate
- Archive
- Delete
- Copy link
- Export

**Behavior**:
- Close on selection
- Close on outside click
- Close on Esc
- Keyboard navigation

#### Inline Editing

**Trigger**: Double-click text or click edit icon

**Behavior**:
- Text becomes input field
- Auto-select current value
- Save on Enter or blur
- Cancel on Esc
- Validation before save

**Visual**:
- Input field in place
- Save and cancel icons
- Focus state clear
- Error state for validation

**Use Cases**:
- Client name
- Matter title
- Notes
- Labels
- Simple text fields

**Features**:
- Auto-save on blur
- Undo option
- Loading state while saving
- Success/error feedback

---

## 7. Responsive Behavior

### Mobile Adaptations (<768px)

#### Navigation

**Collapsible Sidebar → Bottom Nav**:
- Bottom navigation bar (fixed)
- 4-5 main items (icons + labels)
- More menu for additional items
- Active item highlighted

**Bottom Nav Items**:
- Dashboard (home icon)
- Clients (people icon)
- Matters (briefcase icon)
- Calendar (calendar icon)
- More (three dots)

**More Menu**:
- Slide up drawer
- Full list of pages
- Search option
- Settings
- Profile

#### Content Display

**Cards Instead of Tables**:
- Stack information vertically
- Most important info at top
- Expandable for details
- Swipe for quick actions

**Example - Client Card (Mobile)**:
```
┌─────────────────────────────┐
│ [Avatar] John Smith     [•••]│
│ Individual                   │
│ 📞 +592 123 4567             │
│ 📧 john@email.com            │
│ 3 active matters             │
└─────────────────────────────┘
```

**Example - Matter Card (Mobile)**:
```
┌─────────────────────────────┐
│ REF-2024-001                │
│ Work Permit Application      │
│ Client: John Smith           │
│ Status: [Active]   Due: 3 days│
│ ▓▓▓▓▓▓▓▓░░ 75%              │
└─────────────────────────────┘
```

#### Swipe Actions

**Right Swipe** (on list items):
- Reveal actions (edit, archive, delete)
- Color-coded backgrounds
- Action icons
- Swipe threshold: 50%

**Left Swipe**:
- Primary action (e.g., complete, view)
- Green background for positive action

**Visual Feedback**:
- Action appears from side
- Icon scales as swiping
- Vibration feedback (if supported)
- Snap to action or snap back

#### Touch-Friendly Targets

**Minimum Sizes**:
- Buttons: 44px × 44px
- Input fields: 48px height
- Checkboxes/radios: 36px × 36px
- List items: 56px minimum height

**Spacing**:
- Minimum 8px between tappable elements
- Extra padding around clickable areas
- Larger hit areas than visual size

**Interactions**:
- No hover states (use active/focus)
- Clear pressed states
- Avoid small dropdowns (use bottom sheets)
- Large, clear CTAs

#### Forms

**Adaptations**:
- Single column layout
- Full-width inputs
- Larger input fields
- Native select dropdowns
- Native date pickers
- Floating labels
- Bottom sticky button bar

**Wizards**:
- Progress indicator at top
- One step per screen
- Large next/back buttons
- Auto-save drafts
- Exit confirmation

#### Modals → Bottom Sheets

**Small Modals**:
- Slide up from bottom
- Rounded top corners
- Drag to dismiss
- Backdrop overlay

**Large Modals**:
- Full screen
- Header with back/close
- Scrollable content
- Sticky footer with actions

#### Search and Filters

**Search**:
- Full-width search bar
- Auto-focus on page load (search page)
- Recent searches
- Clear button
- Voice input (optional)

**Filters**:
- Filter button (icon + count)
- Slide up drawer with filters
- Apply and clear buttons
- Sticky header in filter drawer

### Tablet Adaptations (768px - 1024px)

#### Layout

**Sidebar**:
- Collapsible (hamburger menu)
- Overlay mode (covers content)
- Or narrow mode (icons only)

**Content Area**:
- Responsive grid (2-3 columns)
- Tables: Hide less important columns
- Horizontal scroll for tables (if needed)

#### Navigation

**Top Bar**:
- Hamburger menu (left)
- Business selector
- Search (center, expandable)
- User menu (right)

**Breadcrumbs**:
- Show last 3 levels
- Truncate long names

#### Data Display

**Tables**:
- Priority columns visible
- Horizontal scroll enabled
- Fixed first and last columns
- Larger row height (48px)

**Cards**:
- Grid: 2-3 columns
- Flexible sizing
- Maintain card proportions

**Forms**:
- Two-column layout (for related fields)
- Full-width for complex inputs
- Side-by-side buttons

#### Touch Optimization

**Target Sizes**:
- Buttons: 40px minimum
- Clickable areas: 44px
- Adequate spacing

**Interactions**:
- Support both touch and mouse
- Show hover states
- Clear focus states
- Larger dropdowns (easier to tap)

### Desktop Optimizations (>1024px)

#### Multi-Column Layouts

**Dashboard**:
- 3-4 column grid for stats
- 2-column for main content + sidebar
- Flexible card grids

**Detail Pages**:
- Sidebar navigation (left)
- Main content (center)
- Related info panel (right)

#### Hover States

**Enhanced Interactions**:
- Tooltips on hover
- Action buttons appear on hover
- Preview on hover (documents, clients)
- Highlight row on hover (tables)

#### Keyboard Navigation

**Full Support**:
- Tab through all interactive elements
- Arrow keys for navigation
- Shortcuts for common actions
- Focus indicators

#### Space Utilization

**Tables**:
- Show all columns
- Larger content area
- Inline expansion (no modal needed)

**Forms**:
- Multi-column layouts
- Side-by-side related fields
- Inline validation messages

**Modals**:
- Appropriate sizing (not full screen)
- Centered on screen
- Backdrop overlay

---

## Design System Integration

### Spacing Scale

- 4px: xs
- 8px: sm
- 12px: md
- 16px: lg
- 24px: xl
- 32px: 2xl
- 48px: 3xl

### Typography Scale

- Headings: 32px, 24px, 20px, 18px, 16px
- Body: 14px (default), 16px (large)
- Small: 12px
- Tiny: 10px

### Border Radius

- sm: 4px (inputs, small buttons)
- md: 6px (buttons, cards)
- lg: 8px (modals, panels)
- xl: 12px (special cards)
- full: 9999px (pills, avatars)

### Shadows

- sm: Subtle (cards at rest)
- md: Medium (dropdowns, hover states)
- lg: Large (modals, elevated panels)
- xl: Extra large (drag and drop)

### Animation Timing

- Fast: 150ms (hover, focus)
- Normal: 250ms (dropdowns, slides)
- Slow: 350ms (page transitions)
- Easing: ease-in-out

### Color Tokens

**Semantic Colors**:
- Primary: Blue (#0066CC)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Danger: Red (#EF4444)
- Info: Blue (#3B82F6)

**UI Colors**:
- Background: #FFFFFF
- Surface: #F9FAFB
- Border: #E5E7EB
- Text Primary: #111827
- Text Secondary: #6B7280

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation**:
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Skip to main content link

**Screen Reader Support**:
- Semantic HTML elements
- ARIA labels where needed
- Alt text for images
- Form labels associated
- Status announcements

**Form Accessibility**:
- Labels for all inputs
- Error messages announced
- Required fields indicated
- Help text associated
- Validation clear and specific

### Focus Management

**Visual Indicators**:
- 2px outline (primary color)
- Offset from element
- High contrast
- Visible on all focusable elements

**Focus Trap** (in modals):
- Focus cycles within modal
- Escape closes modal
- Return focus to trigger

### Responsive Text

**Minimum Font Sizes**:
- Body text: 14px (16px recommended)
- Labels: 12px minimum
- Scalable with user preferences

### Motion and Animation

**Reduced Motion**:
- Respect prefers-reduced-motion
- Disable animations if set
- Instant transitions instead
- Maintain functionality

---

## Performance Considerations

### Lazy Loading

**Images**:
- Load on scroll (intersection observer)
- Placeholder while loading
- Optimize for format (WebP)

**Components**:
- Code splitting for routes
- Lazy load heavy components
- Progressive enhancement

**Data**:
- Paginate large lists
- Virtual scrolling for huge datasets
- Load details on demand

### Optimization

**Bundle Size**:
- Tree shaking
- Remove unused components
- Lazy load date pickers, rich editors
- Optimize icon sets

**Rendering**:
- Memoize expensive components
- Virtualize long lists
- Debounce search inputs
- Throttle scroll handlers

**Caching**:
- Cache API responses
- Service worker for offline
- Optimistic UI updates

---

## Component Library Recommendations

**Suggested Base Libraries**:
- Radix UI (headless components)
- Shadcn UI (styled components)
- React Hook Form (forms)
- TanStack Table (tables)
- Recharts (charts)
- React Calendar (calendar)
- React Dropzone (file upload)

**Why These**:
- Accessible by default
- Customizable styling
- TypeScript support
- Well-documented
- Active maintenance
- Good performance

---

This specification provides a comprehensive foundation for building a consistent, accessible, and user-friendly UI for the GK-Nexus platform. All components should be implemented with TypeScript, follow the Ultracite code standards, and integrate seamlessly with the Better-T-Stack architecture.

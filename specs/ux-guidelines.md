# GK-Nexus UX Guidelines

This document outlines the user experience requirements and design standards for the GK-Nexus platform.

---

## 1. Design Principles

### Intuitive Navigation
- Users should understand where they are and how to get where they need to go
- Navigation structure should reflect the user's mental model of the system
- Common tasks should be easily accessible and require minimal clicks
- Progressive disclosure: show advanced features only when needed

### Clear Visual Hierarchy
- Most important information should be most prominent
- Use size, weight, color, and spacing to establish hierarchy
- Guide the user's eye through the page in a logical flow
- Group related information together

### Consistent Patterns
- Reuse established UI patterns throughout the application
- Maintain consistent spacing, typography, and color usage
- Keep interaction patterns predictable across different sections
- Use the same terminology for the same concepts

### Accessibility (WCAG 2.1 AA)
- All functionality must be keyboard accessible
- Color contrast ratios must meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- All interactive elements must have visible focus indicators
- All images and icons must have appropriate alternative text
- Form inputs must have associated labels
- Page structure must use semantic HTML

---

## 2. Error Handling

### User-Facing Error Messages

Error messages must always be clear, helpful, and actionable. Never expose technical jargon or stack traces to users.

**Core Principles:**
- **Explain WHY**: Tell users what went wrong in plain language
- **Provide actionable next steps**: Guide users on how to fix the issue
- **Use friendly, non-technical language**: Avoid HTTP codes and technical terms
- **Be specific**: Point to the exact problem when possible

**Examples:**

| Bad (Technical) | Good (User-Friendly) |
|----------------|---------------------|
| "400 Bad Request" | "Please fill in all required fields marked with *" |
| "403 Forbidden" | "You don't have permission to access this. Contact your manager to request access." |
| "404 Not Found" | "This client doesn't exist or may have been deleted" |
| "Network Error" | "Unable to connect. Please check your internet connection and try again." |
| "500 Internal Server Error" | "Something went wrong on our end. We've been notified and are working on it. Please try again in a few minutes." |
| "Validation failed" | "Please check: Email must be valid, Password must be at least 8 characters" |
| "Unauthorized" | "Your session has expired. Please sign in again to continue." |
| "Conflict" | "A client with this email already exists. Did you mean to update their information instead?" |

### Form Validation

**Real-Time Validation:**
- Validate fields on blur (when user leaves the field)
- Show success indicators for valid fields (green checkmark)
- Display errors immediately with clear, specific messages
- Don't validate until user has had a chance to complete the field

**Validation Messages:**
- Highlight specific fields with errors using red border and error icon
- Display error message directly below the problematic field
- Use specific language: "Email must include @" instead of "Invalid email"
- Show character count for fields with length limits

**Requirement Hints:**
- Display password requirements before user starts typing
- Show format hints in placeholder text (e.g., "MM/DD/YYYY")
- Use help text below fields for additional context
- Provide examples for complex formats

**Example:**
```
Password *
[                    ]
Must include:
✓ At least 8 characters
✗ One uppercase letter
✓ One number
✗ One special character
```

### Loading States

**Never show blank screens.** Always provide visual feedback during loading.

**Loading Strategies:**
- **Skeleton Loaders**: Show content structure while data loads
- **Spinners**: Use for quick operations (< 3 seconds)
- **Progress Indicators**: Show percentage for operations with known duration
- **Optimistic Updates**: Update UI immediately, rollback if operation fails

**Progress Indicators:**
- Show percentage or step count for multi-step processes
- Provide time estimates for long operations when possible
- Include descriptive text: "Uploading document... 45%"
- Animate smoothly to indicate progress

**Cancel Options:**
- Provide cancel button for operations taking > 5 seconds
- Confirm before canceling destructive operations
- Show feedback when cancellation completes

---

## 3. Feedback & Confirmations

### Success Messages

**Toast Notifications:**
- Appear in top-right corner
- Auto-dismiss after 4-5 seconds
- Include checkmark icon and clear message
- Don't interrupt user workflow

**Examples:**
- "Client added successfully"
- "Document uploaded"
- "Deadline updated"
- "Changes saved"

### Confirmation Dialogs

**Use for destructive actions:**
- Deleting records
- Archiving important data
- Canceling multi-step processes
- Removing access/permissions

**Dialog Structure:**
```
⚠ Delete Client?

This will permanently delete "John Doe" and all associated matters,
documents, and deadlines. This action cannot be undone.

[Cancel] [Delete Client]
```

**Best Practices:**
- Use clear, action-oriented button labels ("Delete Client" not "Yes")
- Explain consequences of the action
- Make destructive actions visually distinct (red button)
- Default focus on safe option (Cancel)

### Undo Options

**Provide undo when possible:**
- After deleting items (show toast with "Undo" button)
- After bulk operations
- After moving/archiving items
- Time window: 5-10 seconds before permanent action

**Example:**
```
Toast: "3 clients archived [Undo]"
```

---

## 4. Icons & Visual Cues

### Icon Usage

**Use Lucide icons consistently:**
- Always pair icons with text labels for clarity
- Use the same icon for the same action throughout the app
- Size icons appropriately: 16px for inline, 20-24px for buttons
- Ensure sufficient contrast (icons should meet WCAG AA standards)

**Common Icon Mappings:**
- Plus/PlusCircle: Add/Create
- Pencil/Edit: Edit/Modify
- Trash2: Delete
- Archive: Archive
- Download: Download/Export
- Upload: Upload
- Search: Search
- Filter: Filter
- Calendar: Dates/Deadlines
- User/Users: People/Clients
- Briefcase: Matters/Cases
- FileText: Documents
- Bell: Notifications
- Settings: Settings/Configuration

### Color Coding

Use consistent semantic colors:

- **Green**: Success, completion, positive status
  - Hex: `#10b981` (green-500)
  - Usage: Success messages, completed tasks, active status

- **Red**: Error, danger, destructive actions
  - Hex: `#ef4444` (red-500)
  - Usage: Error messages, delete buttons, overdue items

- **Yellow/Amber**: Warning, attention needed
  - Hex: `#f59e0b` (amber-500)
  - Usage: Warning messages, items needing attention, approaching deadlines

- **Blue**: Info, neutral actions, links
  - Hex: `#3b82f6` (blue-500)
  - Usage: Info messages, primary actions, hyperlinks

- **Gray**: Inactive, disabled, neutral
  - Hex: `#6b7280` (gray-500)
  - Usage: Disabled elements, subtle text, dividers

### Status Badges

Use colored badges to indicate status:

```
Active        → Green badge
Pending       → Yellow badge
Overdue       → Red badge
Completed     → Blue badge
Archived      → Gray badge
```

**Badge Structure:**
- Small, rounded pill shape
- Icon + text (when space allows)
- Sufficient padding for touch targets on mobile
- Accessible color contrast

---

## 5. Empty States

Empty states should guide users toward their next action.

### Components of Good Empty States

**Visual Element:**
- Simple, relevant illustration or icon
- Keep it lightweight and non-distracting
- Maintain consistent visual style

**Clear Message:**
- Explain what's missing: "No clients yet"
- Keep it friendly and encouraging
- Avoid technical language

**Call-to-Action:**
- Prominent button or link
- Action-oriented label: "Add Your First Client"
- Make it visually distinct

### Examples

**Empty Client List:**
```
[Icon: Users]

No clients yet

Get started by adding your first client to track their matters
and deadlines.

[+ Add Client]
```

**Empty Search Results:**
```
[Icon: Search]

No results found

Try adjusting your search terms or filters.

[Clear Filters]
```

**Empty Deadlines:**
```
[Icon: Calendar]

No upcoming deadlines

You're all caught up! Deadlines you create will appear here.

[+ Add Deadline]
```

---

## 6. Form Design

### Layout & Structure

**Label Positioning:**
- Place labels above inputs (not beside)
- Use sentence case: "First name" not "First Name"
- Mark required fields with asterisk (*)
- Keep labels concise but descriptive

**Input Fields:**
- Use appropriate input types (email, tel, date, etc.)
- Size inputs appropriately for expected content
- Provide adequate touch targets (44px minimum height)
- Use consistent spacing between fields

### Placeholder Text

**Use placeholders for hints, not labels:**
- Good: Label "Email" with placeholder "you@example.com"
- Bad: No label, only placeholder "Enter your email"
- Placeholders should show format or example
- Keep placeholder text short

### Required Fields

**Indicate required fields clearly:**
- Add asterisk (*) after label: "Email *"
- Include legend at top: "* Required fields"
- Use color coding (red asterisk) but don't rely on color alone
- Consider making most fields required (simpler than marking many)

### Help Text

**Provide context for complex fields:**
- Display below input field in smaller, muted text
- Explain format requirements or constraints
- Link to additional help when needed
- Keep it concise

**Example:**
```
Tax ID Number *
[                    ]
9-digit number without dashes (123456789)
```

### Smart Defaults

**Pre-fill when possible:**
- Use previous selections
- Default to most common choice
- Pre-populate based on user context
- Allow easy override

**Examples:**
- Default deadline date to tomorrow
- Pre-select user's assigned matters
- Remember filter preferences
- Auto-fill based on related data

### Multi-Step Forms

**For complex data entry:**
- Show progress indicator (Step 2 of 4)
- Allow navigation between steps
- Save progress automatically
- Validate each step before proceeding
- Provide summary before final submission

---

## 7. Navigation

### Breadcrumbs

**Use for hierarchical navigation:**
- Show path from home to current page
- Make each level clickable
- Use chevron (>) or slash (/) separator
- Truncate intelligently on mobile

**Example:**
```
Home > Clients > John Doe > Matter #123
```

### Back Buttons

**Provide explicit back navigation:**
- Include back arrow on detail pages
- Place in top-left of content area
- Label clearly: "← Back to Clients"
- Maintain scroll position when returning

### Sidebar Navigation

**Primary navigation structure:**
- Keep items in consistent order
- Highlight active page/section
- Use icons + labels
- Collapse on mobile with hamburger menu
- Group related items

**Suggested Structure:**
```
Dashboard
Clients
Matters
Documents
Deadlines
───────────
Settings
Help
```

### Search Functionality

**Make search always accessible:**
- Place in header or sidebar
- Use keyboard shortcut (Cmd/Ctrl + K)
- Show recent searches
- Provide filters for results
- Highlight matched terms in results

---

## 8. Responsive Design

### Mobile-First Approach

**Design for mobile, enhance for desktop:**
- Start with smallest screen size
- Add complexity as screen size increases
- Prioritize essential features for mobile
- Test on actual devices

### Touch-Friendly Targets

**Minimum interactive element sizes:**
- Buttons: 44px × 44px minimum
- Links in text: 44px height with adequate padding
- Form inputs: 44px minimum height
- Icons: 24px with 44px touch target area
- Spacing between targets: 8px minimum

### Collapsible Sidebar

**Mobile navigation:**
- Hide sidebar by default on mobile
- Hamburger menu button in header
- Slide-in overlay when opened
- Close on selection or backdrop click
- Swipe gesture to close

### Responsive Tables

**Handle data tables on small screens:**
- Stack columns vertically on mobile
- Show most important columns only
- Provide horizontal scroll with scroll indicator
- Offer card view alternative
- Allow column selection on mobile

### Breakpoints

**Standard breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Large Desktop: > 1280px

---

## 9. Accessibility

### Keyboard Navigation

**All functionality must be keyboard accessible:**
- Tab order follows logical reading order
- Focus visible on all interactive elements
- Skip to main content link
- Escape closes modals/dropdowns
- Arrow keys navigate menus and lists
- Enter/Space activates buttons

**Focus Management:**
- Move focus to modal when opened
- Return focus when modal closes
- Trap focus within modal
- Visible focus indicator (outline or border)

### Screen Reader Support

**ARIA labels and landmarks:**
- Use semantic HTML (nav, main, aside, etc.)
- Add ARIA labels for icon-only buttons
- Announce dynamic content changes
- Label form inputs properly
- Provide text alternatives for images

**Live Regions:**
- Announce toast notifications
- Update status messages
- Indicate loading states
- Confirm form submissions

### Color Contrast

**WCAG 2.1 AA Requirements:**
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18pt+ or 14pt+ bold): 3:1 minimum
- UI components and graphics: 3:1 minimum
- Don't rely on color alone to convey information

**Testing:**
- Use browser dev tools contrast checker
- Test with color blindness simulators
- Verify in dark mode (if applicable)

### Focus Indicators

**Visible focus states:**
- Default browser outline or custom ring
- Sufficient contrast (3:1 minimum)
- Visible against all backgrounds
- Consistent across all interactive elements

---

## 10. Component Standards

### Button Hierarchy

Use consistent button styles to indicate importance:

**Primary Button:**
- Solid background color
- Use for main action on page
- Only one per section
- Examples: "Save", "Submit", "Add Client"

**Secondary Button:**
- Outlined style
- Use for alternative actions
- Examples: "Cancel", "Go Back"

**Outline Button:**
- Ghost button with border
- Use for tertiary actions
- Examples: "Learn More", "View Details"

**Ghost Button:**
- No border, just text
- Use for low-priority actions
- Examples: "Skip", "Remind Me Later"

**Destructive Button:**
- Red background (for primary) or red outline
- Use for delete/remove actions
- Always confirm before executing

**Icon Button:**
- Icon only, no text
- Include aria-label for accessibility
- Use for common actions (edit, delete, close)
- Show tooltip on hover

### Card Layouts

**Use cards for discrete data objects:**
- White background with subtle shadow
- Rounded corners
- Padding: 16-24px
- Hover state for interactive cards
- Clear visual grouping

**Card Structure:**
```
┌────────────────────────────┐
│ [Icon] Title               │
│                            │
│ Description or content     │
│                            │
│ [Action Buttons]           │
└────────────────────────────┘
```

### Tables

**Data table features:**
- Zebra striping for readability (optional)
- Sortable columns (click header)
- Filterable data
- Row selection (checkbox)
- Pagination for large datasets
- Row actions menu (three dots)

**Table Headers:**
- Sticky header on scroll
- Sort indicator (arrow icon)
- Filter icon when applicable
- Clear column labels

**Responsive Handling:**
- Horizontal scroll on mobile
- Stack as cards on small screens
- Show only essential columns

### Modal Dialogs

**Use for focused tasks:**
- Overlay with semi-transparent backdrop
- Centered on screen
- Close on backdrop click or Esc key
- Focus trap within modal
- Clear title and action buttons

**Modal Structure:**
```
────────────────────────────
  Title                  [×]

  Content area with form
  or information

  [Cancel] [Primary Action]
────────────────────────────
```

**Best Practices:**
- Keep modals focused on single task
- Limit size (don't fill entire screen)
- Provide clear exit options
- Confirm destructive actions
- Show loading state during submission

### Dropdown Menus

**Consistent dropdown behavior:**
- Open on click, not hover
- Close when clicking outside
- Keyboard navigable (arrow keys)
- Highlight selected item
- Maximum height with scroll for long lists

### Form Controls

**Standard inputs:**
- Text inputs: single line, auto-resize
- Textareas: multi-line, resizable
- Select dropdowns: searchable for long lists
- Checkboxes: for multiple selections
- Radio buttons: for single selection
- Date pickers: calendar interface
- File uploads: drag-and-drop support

**States:**
- Default
- Focus (blue border/ring)
- Error (red border + message)
- Disabled (grayed out, reduced opacity)
- Success (green border/checkmark)

---

## Implementation Checklist

When implementing new features, ensure:

- [ ] All interactive elements are keyboard accessible
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Error messages are user-friendly and actionable
- [ ] Loading states are shown for async operations
- [ ] Empty states guide users to next action
- [ ] Forms include validation and help text
- [ ] Destructive actions require confirmation
- [ ] Success feedback is provided
- [ ] Mobile layout is tested and functional
- [ ] Screen reader announcements are appropriate
- [ ] Icons include text labels or ARIA labels
- [ ] Focus management is handled properly
- [ ] Consistent spacing and typography is used
- [ ] Component variants match design system

---

## Resources

### Design Tokens
- Refer to `/apps/web/src/index.css` for color variables
- Use Tailwind CSS classes for consistent spacing
- Follow shadcn/ui component patterns

### Icons
- Use Lucide React: https://lucide.dev
- Import only needed icons to reduce bundle size

### Accessibility Testing
- Use Lighthouse in Chrome DevTools
- Test with screen reader (NVDA, VoiceOver)
- Keyboard-only navigation testing
- Color contrast checker tools

### Further Reading
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Inclusive Components: https://inclusive-components.design/
- Material Design Accessibility: https://m3.material.io/foundations/accessible-design/overview

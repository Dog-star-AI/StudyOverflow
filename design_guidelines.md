# StudyOverflow Design Guidelines

## Design Approach
**System-Based with Reddit Inspiration**: Combining Material Design principles with Reddit's proven information-dense patterns. Focus on clarity, scannability, and efficient content consumption for academic discussions.

## Core Design Principles
1. **Information Density**: Maximize content visibility while maintaining readability
2. **Hierarchical Clarity**: Clear visual distinction between universities → courses → posts → comments
3. **Rapid Scanning**: Students should quickly identify relevant problems and solutions
4. **Academic Credibility**: Professional appearance that feels trustworthy for educational content

## Typography
- **Headings**: Inter or System UI Stack
  - Post titles: text-lg font-semibold
  - Section headers: text-2xl font-bold
  - Comment authors: text-sm font-medium
- **Body**: System font stack for optimal readability
  - Post content: text-base
  - Comments: text-sm
  - Metadata: text-xs
- Maintain strong hierarchy through size and weight, not color variations

## Layout System
**Spacing Units**: Tailwind 2, 3, 4, 6, 8 for consistent rhythm
- Component padding: p-4
- Section gaps: gap-6
- Page margins: px-4 md:px-6
- Card spacing: space-y-3

**Container Strategy**:
- Max-width content: max-w-5xl mx-auto
- Sidebar navigation: w-64 fixed
- Feed layout: Two-column (sidebar + main feed) on desktop, stacked on mobile

## Component Library

### Navigation
- **Top Bar**: Sticky header with search, university selector, user menu
- **Sidebar**: Hierarchical navigation (Universities → Courses list), scrollable
- **Breadcrumbs**: University > Course > Post for context awareness

### Post Cards (Reddit-style)
- **Compact Card Structure**:
  - Left voting column (w-12): Upvote arrow, vote count, downvote arrow
  - Main content area: Title (clickable), preview text (2-3 lines), metadata row
  - Metadata: Author, timestamp, course tag, comment count, share button
- Border-left accent (4px) for status indicators (answered/unanswered)
- Hover state: subtle background shift for entire card

### Comment Threads
- **Nested Structure**: 
  - Left border (2px) for each nesting level with offset (pl-4 per level)
  - Max 5 levels deep before "continue thread" pattern
- **Comment Layout**: Author badge + timestamp + content + action bar (reply, vote)
- Collapse/expand controls for long threads

### Voting System
- Icon-based arrows (outline style from Heroicons)
- Vote count centered between arrows
- Active state: filled arrow when voted
- Size: text-xl for post votes, text-base for comment votes

### User Elements
- **Profile Badge**: Avatar (w-8 h-8) + username + reputation score
- **Reputation Display**: Number with academic icon (graduation cap)
- **Best Answer Badge**: Checkmark icon for accepted solutions

### Forms
- **Create Post**: 
  - Title input (prominent, text-lg)
  - Rich text editor for problem description
  - Tag selector for course/topic
  - Preview mode toggle
- **Reply Box**: Expandable textarea with markdown support hint

### Navigation Tabs
- Sort options: Hot, New, Top (This Week/Month/All Time)
- Tab style: Underline indicator, semi-bold for active

## Images
**No Hero Image Required** - This is a utility-first application focused on content consumption

**Icon Usage**:
- Heroicons (outline and solid variants)
- University logos: Small circular avatars (w-6 h-6) next to university names
- Course icons: Subject-specific icons in navigation

## Page Layouts

### Home/Feed Page
- Sticky top navigation
- Left sidebar (university/course browser)
- Center feed (post cards in vertical list)
- Right sidebar (trending topics, recent activity) - optional on desktop, hidden on mobile

### Post Detail Page
- Breadcrumb navigation
- Post content (full display with rich formatting)
- Accepted solution highlighted (if exists)
- Comment thread below
- Related posts sidebar

### University/Course Pages
- Header with university/course info
- Stats bar (members, posts, activity)
- Post feed filtered to that context
- Course-specific sidebar (syllabus links, resources)

## Interactive Elements
- **Voting**: Immediate visual feedback, count animation
- **Comment Collapse**: Smooth height transition
- **Post Preview**: Expand inline vs navigate to full page
- Minimize animations - use only for feedback, not decoration

## Accessibility
- Semantic HTML for all interactive elements
- Keyboard navigation for all actions
- ARIA labels for voting buttons
- Focus indicators on all interactive elements
- Sufficient contrast ratios throughout

## Mobile Responsiveness
- Single column layout on mobile
- Bottom navigation bar for key actions
- Collapsible sidebar as drawer
- Larger touch targets for voting (min-h-12)
- Simplified metadata display (hide less critical info)

This design creates a familiar, efficient academic community platform that prioritizes content discovery and meaningful peer-to-peer learning interactions.
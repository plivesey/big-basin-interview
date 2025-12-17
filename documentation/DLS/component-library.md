# Design Language System: Component Library

**Version**: 1.0
**Last Updated**: December 2024
**Brand**: The Trusted Guide

This component library defines all UI components for the Service Booking Assistant, implementing the brand strategy with precise specifications for developers.

---

## Table of Contents

1. [Typography Components](#typography-components)
2. [Buttons](#buttons)
3. [Chat Messages](#chat-messages)
4. [Cards](#cards)
5. [Form Inputs](#form-inputs)
6. [Loading States](#loading-states)
7. [Icons & Badges](#icons--badges)
8. [Time Slot Selectors](#time-slot-selectors)
9. [Status Indicators](#status-indicators)
10. [Modals & Overlays](#modals--overlays)
11. [Navigation](#navigation)
12. [Lists](#lists)
13. [Dividers & Spacers](#dividers--spacers)
14. [Feedback Components](#feedback-components)

---

## Typography Components

### Heading 1 - Page Title

**Usage**: Main page headings, primary titles

```tsx
<h1 className="text-3xl font-bold text-gray-800 leading-tight">
  Find Your Service
</h1>
```

**Specifications**:
- Font size: `text-3xl` (30px / 1.875rem)
- Weight: `font-bold` (700)
- Color: `text-gray-800` (#1F2937)
- Line height: `leading-tight` (1.3)
- Bottom margin: `mb-4` (16px) when followed by content

**Variants**:
```tsx
// With subtitle
<div className="mb-6">
  <h1 className="text-3xl font-bold text-gray-800 leading-tight mb-2">
    Your Booking is Confirmed
  </h1>
  <p className="text-lg text-slate-600">
    All the details have been sent to your email
  </p>
</div>
```

---

### Heading 2 - Section Title

**Usage**: Major section headings, card titles

```tsx
<h2 className="text-2xl font-semibold text-gray-800 leading-snug">
  Available Providers
</h2>
```

**Specifications**:
- Font size: `text-2xl` (24px / 1.5rem)
- Weight: `font-semibold` (600)
- Color: `text-gray-800`
- Line height: `leading-snug` (1.4)
- Bottom margin: `mb-3` (12px)

---

### Heading 3 - Subsection Title

**Usage**: Card headings, provider names, subsection titles

```tsx
<h3 className="text-xl font-semibold text-gray-800">
  Mike's Plumbing Service
</h3>
```

**Specifications**:
- Font size: `text-xl` (20px / 1.25rem)
- Weight: `font-semibold` (600)
- Color: `text-gray-800`
- Bottom margin: `mb-2` (8px)

---

### Body Text - Large

**Usage**: Important body text, introductions, descriptions

```tsx
<p className="text-lg text-gray-800 leading-relaxed">
  Tell me what service you need, and I'll help you find the perfect provider.
</p>
```

**Specifications**:
- Font size: `text-lg` (18px / 1.125rem)
- Color: `text-gray-800`
- Line height: `leading-relaxed` (1.6)

---

### Body Text - Standard

**Usage**: Default body text, chat messages, descriptions

```tsx
<p className="text-base text-gray-800 leading-relaxed">
  I found 5 top-rated hair salons near you. All have availability this week.
</p>
```

**Specifications**:
- Font size: `text-base` (16px / 1rem)
- Color: `text-gray-800`
- Line height: `leading-relaxed` (1.6)
- Paragraph spacing: `mb-4` between paragraphs

---

### Body Text - Small

**Usage**: Secondary information, metadata, labels

```tsx
<p className="text-sm text-slate-600">
  Last updated 5 minutes ago
</p>
```

**Specifications**:
- Font size: `text-sm` (14px / 0.875rem)
- Color: `text-slate-600` (#475569)
- Line height: `leading-normal` (1.5)

---

### Caption Text

**Usage**: Timestamps, footnotes, helper text

```tsx
<span className="text-xs text-slate-500">
  2:34 PM
</span>
```

**Specifications**:
- Font size: `text-xs` (12px / 0.75rem)
- Color: `text-slate-500`
- Line height: `leading-tight` (1.4)

---

### Label Text

**Usage**: Form labels, category tags

```tsx
<label className="block text-sm font-medium text-gray-800 mb-2">
  Service Location
</label>
```

**Specifications**:
- Font size: `text-sm` (14px)
- Weight: `font-medium` (500)
- Color: `text-gray-800`
- Display: `block`
- Bottom margin: `mb-2` (8px)

---

## Buttons

### Primary Button

**Usage**: Main actions, submit, confirm

```tsx
<button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-200 shadow-sm hover:shadow-md">
  Book This Time
</button>
```

**Specifications**:
- Padding: `px-5 py-2.5` (20px horizontal, 10px vertical)
- Background: `bg-indigo-600` (#4F46E5)
- Text: `text-white font-medium`
- Border radius: `rounded-lg` (8px)
- Hover: `hover:bg-indigo-700` (#4338CA)
- Active: `active:bg-indigo-800`
- Shadow: `shadow-sm hover:shadow-md`
- Transition: `transition-colors duration-200`

**Variants**:

```tsx
// Large Primary Button
<button className="px-6 py-3 text-lg bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-200 shadow-sm hover:shadow-md">
  Get Started
</button>

// Small Primary Button
<button className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-200">
  Select
</button>

// Disabled State
<button className="px-5 py-2.5 bg-slate-300 text-slate-500 font-medium rounded-lg cursor-not-allowed" disabled>
  Book This Time
</button>

// Full Width
<button className="w-full px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-200 shadow-sm hover:shadow-md">
  Continue
</button>
```

---

### Secondary Button

**Usage**: Alternative actions, cancel, back

```tsx
<button className="px-5 py-2.5 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 active:bg-indigo-300 transition-colors duration-200">
  Change Provider
</button>
```

**Specifications**:
- Padding: `px-5 py-2.5`
- Background: `bg-indigo-100` (#E0E7FF)
- Text: `text-indigo-700 font-medium`
- Border radius: `rounded-lg` (8px)
- Hover: `hover:bg-indigo-200`
- Active: `active:bg-indigo-300`
- Transition: `transition-colors duration-200`

**Variants**:

```tsx
// Large Secondary
<button className="px-6 py-3 text-lg bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 active:bg-indigo-300 transition-colors duration-200">
  View Details
</button>

// Small Secondary
<button className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 active:bg-indigo-300 transition-colors duration-200">
  Edit
</button>
```

---

### Text Button

**Usage**: Low-emphasis actions, links, tertiary actions

```tsx
<button className="px-3 py-2 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 active:bg-indigo-100 transition-colors duration-200">
  Skip for now
</button>
```

**Specifications**:
- Padding: `px-3 py-2`
- Background: `transparent` (hover: `hover:bg-indigo-50`)
- Text: `text-indigo-600 font-medium`
- Border radius: `rounded-lg`
- Active: `active:bg-indigo-100`
- Transition: `transition-colors duration-200`

---

### Icon Button

**Usage**: Actions with icons only, compact actions

```tsx
<button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200">
  <svg className="w-5 h-5" /* icon */></svg>
</button>
```

**Specifications**:
- Padding: `p-2` (8px all sides)
- Icon size: `w-5 h-5` (20px)
- Text color: `text-slate-600`
- Hover: `hover:bg-slate-100`
- Border radius: `rounded-lg`
- Min touch target: 44x44px for accessibility

---

## Chat Messages

### User Message Bubble

**Usage**: Messages sent by the user

```tsx
<div className="flex justify-end mb-4">
  <div className="max-w-[70%] px-4 py-3 bg-indigo-600 text-white rounded-2xl rounded-tr-sm">
    <p className="text-base leading-relaxed">
      I need a plumber in 94103
    </p>
  </div>
</div>
```

**Specifications**:
- Container: `flex justify-end mb-4` (aligned right)
- Max width: `max-w-[70%]` (70% of container)
- Padding: `px-4 py-3` (16px horizontal, 12px vertical)
- Background: `bg-indigo-600` (#4F46E5)
- Text: `text-white`
- Border radius: `rounded-2xl` (16px) with `rounded-tr-sm` (small top-right for tail effect)
- Text size: `text-base leading-relaxed`

**Variants**:

```tsx
// Multi-line User Message
<div className="flex justify-end mb-4">
  <div className="max-w-[70%] px-4 py-3 bg-indigo-600 text-white rounded-2xl rounded-tr-sm">
    <p className="text-base leading-relaxed">
      I need a plumber for an emergency repair.
      Preferably someone available today in the 94103 area.
    </p>
  </div>
</div>
```

---

### Assistant Message Bubble

**Usage**: Messages sent by the AI assistant

```tsx
<div className="flex justify-start mb-4">
  <div className="max-w-[70%] px-4 py-3 bg-slate-50 text-gray-800 rounded-2xl rounded-tl-sm border border-slate-200">
    <p className="text-base leading-relaxed">
      I can help you find a plumber. To show you the best options,
      I need a bit more info:
    </p>
    <ul className="mt-2 space-y-1 text-base">
      <li>• What's your location or zip code?</li>
      <li>• Is this urgent, or are you flexible on timing?</li>
    </ul>
  </div>
</div>
```

**Specifications**:
- Container: `flex justify-start mb-4` (aligned left)
- Max width: `max-w-[70%]`
- Padding: `px-4 py-3`
- Background: `bg-slate-50` (#F8FAFC)
- Border: `border border-slate-200`
- Text: `text-gray-800`
- Border radius: `rounded-2xl` with `rounded-tl-sm` (small top-left for tail)
- Text size: `text-base leading-relaxed`

**Variants**:

```tsx
// Assistant Message with Action
<div className="flex justify-start mb-4">
  <div className="max-w-[70%] px-4 py-3 bg-slate-50 text-gray-800 rounded-2xl rounded-tl-sm border border-slate-200">
    <p className="text-base leading-relaxed mb-3">
      Perfect! Let me confirm the details:
    </p>
    <div className="p-3 bg-white rounded-lg border border-slate-200 mb-3">
      <p className="text-sm text-slate-600 mb-1">Service</p>
      <p className="text-base font-medium text-gray-800">Emergency Plumbing</p>
    </div>
    <button className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
      Confirm Booking
    </button>
  </div>
</div>

// Loading Message
<div className="flex justify-start mb-4">
  <div className="px-4 py-3 bg-slate-50 text-gray-800 rounded-2xl rounded-tl-sm border border-slate-200">
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
      <span className="text-sm text-slate-500">Searching...</span>
    </div>
  </div>
</div>
```

---

### Timestamp

**Usage**: Show when messages were sent

```tsx
<div className="flex justify-center mb-6">
  <span className="px-3 py-1 text-xs text-slate-500 bg-slate-100 rounded-full">
    Today at 2:34 PM
  </span>
</div>
```

**Specifications**:
- Container: `flex justify-center` (centered)
- Padding: `px-3 py-1`
- Text: `text-xs text-slate-500`
- Background: `bg-slate-100`
- Border radius: `rounded-full`

---

## Cards

### Provider Card

**Usage**: Display service provider information in search results

```tsx
<div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer">
  {/* Header */}
  <div className="flex justify-between items-start mb-3">
    <div className="flex-1">
      <h3 className="text-xl font-semibold text-gray-800 mb-1">
        Mike's Plumbing Service
      </h3>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600">Plumbing</span>
        <span className="text-slate-400">•</span>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-amber-500 fill-current">
            {/* Star icon */}
          </svg>
          <span className="text-sm font-medium text-gray-800">4.8</span>
          <span className="text-sm text-slate-500">(124)</span>
        </div>
      </div>
    </div>
  </div>

  {/* Location */}
  <div className="flex items-center space-x-2 mb-4">
    <svg className="w-4 h-4 text-slate-500">
      {/* Location icon */}
    </svg>
    <span className="text-sm text-slate-600">0.8 miles away • San Francisco</span>
  </div>

  {/* Action */}
  <button className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
    View Availability
  </button>
</div>
```

**Specifications**:
- Background: `bg-white`
- Border: `border border-slate-200`
- Border radius: `rounded-xl` (12px)
- Padding: `p-5` (20px)
- Hover state: `hover:border-indigo-200 hover:shadow-md`
- Transition: `transition-all duration-200`
- Cursor: `cursor-pointer`

**Variants**:

```tsx
// Provider Card - Selected State
<div className="bg-white border-2 border-indigo-600 rounded-xl p-5 shadow-md">
  {/* Same content as above */}
  <div className="flex items-center justify-center space-x-2 mt-3">
    <svg className="w-5 h-5 text-indigo-600">
      {/* Checkmark icon */}
    </svg>
    <span className="text-sm font-medium text-indigo-600">Selected</span>
  </div>
</div>

// Provider Card - Compact
<div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-200 transition-all duration-200">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="text-base font-semibold text-gray-800 mb-1">
        Mike's Plumbing
      </h4>
      <div className="flex items-center space-x-2 text-sm text-slate-600">
        <span>4.8 ⭐</span>
        <span>•</span>
        <span>0.8 mi</span>
      </div>
    </div>
    <button className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors text-sm">
      Select
    </button>
  </div>
</div>
```

---

### Info Card

**Usage**: Display important information, confirmations, summaries

```tsx
<div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">
    Booking Summary
  </h3>

  <div className="space-y-3">
    <div>
      <p className="text-sm text-slate-600 mb-1">Service</p>
      <p className="text-base font-medium text-gray-800">Emergency Plumbing</p>
    </div>

    <div>
      <p className="text-sm text-slate-600 mb-1">Provider</p>
      <p className="text-base font-medium text-gray-800">Mike's Plumbing Service</p>
    </div>

    <div>
      <p className="text-sm text-slate-600 mb-1">Date & Time</p>
      <p className="text-base font-medium text-gray-800">Tuesday, Dec 21 at 2:00 PM</p>
    </div>

    <div>
      <p className="text-sm text-slate-600 mb-1">Location</p>
      <p className="text-base font-medium text-gray-800">123 Main St, San Francisco, CA 94103</p>
    </div>
  </div>
</div>
```

**Specifications**:
- Background: `bg-slate-50`
- Border: `border border-slate-200`
- Border radius: `rounded-xl` (12px)
- Padding: `p-5` (20px)
- Field spacing: `space-y-3` (12px between fields)

**Variants**:

```tsx
// Success Info Card
<div className="bg-green-50 border border-green-200 rounded-xl p-5">
  <div className="flex items-start space-x-3">
    <svg className="w-6 h-6 text-green-600 flex-shrink-0">
      {/* Success checkmark icon */}
    </svg>
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Booking Confirmed!
      </h3>
      <p className="text-base text-gray-800">
        Your appointment is confirmed for Tuesday, Dec 21 at 2:00 PM.
        A confirmation email has been sent to your inbox.
      </p>
    </div>
  </div>
</div>

// Warning Info Card
<div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
  <div className="flex items-start space-x-3">
    <svg className="w-6 h-6 text-amber-600 flex-shrink-0">
      {/* Warning icon */}
    </svg>
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Limited Availability
      </h3>
      <p className="text-base text-gray-800">
        This provider only has 2 time slots left today. Book soon to secure your spot.
      </p>
    </div>
  </div>
</div>
```

---

## Form Inputs

### Text Input

**Usage**: Single-line text entry (location, name, etc.)

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-800 mb-2">
    Your Location
  </label>
  <input
    type="text"
    placeholder="Enter zip code or address"
    className="w-full px-4 py-2.5 text-base text-gray-800 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors"
  />
</div>
```

**Specifications**:
- Width: `w-full`
- Padding: `px-4 py-2.5` (16px horizontal, 10px vertical)
- Text: `text-base text-gray-800`
- Placeholder: `placeholder-slate-400`
- Background: `bg-white`
- Border: `border border-slate-300`
- Border radius: `rounded-lg` (8px)
- Focus: `focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600`
- Transition: `transition-colors`

**Variants**:

```tsx
// With Error State
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-800 mb-2">
    Your Location
  </label>
  <input
    type="text"
    placeholder="Enter zip code or address"
    className="w-full px-4 py-2.5 text-base text-gray-800 placeholder-slate-400 bg-white border-2 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-600"
  />
  <p className="mt-2 text-sm text-red-600">
    Please enter a valid location
  </p>
</div>

// With Success State
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-800 mb-2">
    Your Location
  </label>
  <div className="relative">
    <input
      type="text"
      value="94103"
      className="w-full px-4 py-2.5 pr-10 text-base text-gray-800 bg-white border-2 border-green-500 rounded-lg focus:outline-none"
    />
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600">
      {/* Checkmark icon */}
    </svg>
  </div>
</div>

// Disabled State
<input
  type="text"
  value="94103"
  disabled
  className="w-full px-4 py-2.5 text-base text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
/>
```

---

### Textarea

**Usage**: Multi-line text entry (additional details, special requests)

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-800 mb-2">
    Additional Details (Optional)
  </label>
  <textarea
    placeholder="Any specific requirements or preferences..."
    rows={4}
    className="w-full px-4 py-2.5 text-base text-gray-800 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors resize-none"
  />
</div>
```

**Specifications**:
- Same as text input
- Resize: `resize-none` (fixed height) or `resize-y` (vertical resize only)
- Rows: 3-6 typically

---

### Search Input

**Usage**: Search for services, providers

```tsx
<div className="relative mb-4">
  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
    {/* Search icon */}
  </svg>
  <input
    type="search"
    placeholder="Search for a service..."
    className="w-full pl-11 pr-4 py-2.5 text-base text-gray-800 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors"
  />
</div>
```

**Specifications**:
- Icon: Absolute positioned, left side
- Padding: `pl-11` (44px left for icon), `pr-4 py-2.5`
- Other specs same as text input

---

## Loading States

### Inline Loading Dots

**Usage**: Show during AI processing, short waits

```tsx
<div className="flex items-center space-x-2">
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
  </div>
  <span className="text-sm text-slate-500">Searching for providers...</span>
</div>
```

**Specifications**:
- Dots: `w-2 h-2` (8px), `bg-slate-400`, `rounded-full`
- Animation: `animate-bounce` with staggered delays
- Text: `text-sm text-slate-500`
- Spacing: `space-x-1` (4px between dots)

---

### Spinner

**Usage**: Full page loading, modal loading

```tsx
<div className="flex items-center justify-center">
  <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
</div>
```

**Specifications**:
- Size: `w-8 h-8` (32px) for standard, `w-12 h-12` for large
- Border: `border-4 border-slate-200` (light gray)
- Top border: `border-t-indigo-600` (colored to show rotation)
- Animation: `animate-spin`

**Variants**:

```tsx
// Large Spinner
<div className="flex items-center justify-center py-12">
  <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
</div>

// Small Spinner (for buttons)
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

// Loading Button
<button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg flex items-center space-x-2" disabled>
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  <span>Loading...</span>
</button>
```

---

### Skeleton Loader

**Usage**: Loading state for provider cards, content blocks

```tsx
<div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
  {/* Header skeleton */}
  <div className="flex justify-between items-start mb-3">
    <div className="flex-1">
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    </div>
  </div>

  {/* Location skeleton */}
  <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>

  {/* Button skeleton */}
  <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
</div>
```

**Specifications**:
- Background: `bg-slate-200` (light gray bars)
- Animation: `animate-pulse` on container
- Border radius: Match the actual component
- Heights: Match text line heights (`h-4` for small text, `h-6` for headings, etc.)

---

### Progress Bar

**Usage**: Multi-step processes, file uploads

```tsx
<div className="mb-4">
  <div className="flex justify-between items-center mb-2">
    <span className="text-sm font-medium text-gray-800">Step 2 of 3</span>
    <span className="text-sm text-slate-600">66%</span>
  </div>
  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
    <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{width: '66%'}}></div>
  </div>
</div>
```

**Specifications**:
- Container: `w-full h-2 bg-slate-200 rounded-full`
- Progress: `h-full bg-indigo-600 rounded-full`
- Transition: `transition-all duration-300`
- Labels: Optional text above showing progress

---

## Icons & Badges

### Icon Sizes

```tsx
// Extra Small (16px)
<svg className="w-4 h-4 text-slate-600">
  {/* Icon path */}
</svg>

// Small (20px)
<svg className="w-5 h-5 text-slate-600">
  {/* Icon path */}
</svg>

// Medium (24px) - Default
<svg className="w-6 h-6 text-slate-600">
  {/* Icon path */}
</svg>

// Large (32px)
<svg className="w-8 h-8 text-slate-600">
  {/* Icon path */}
</svg>
```

**Color Guidelines**:
- Default: `text-slate-600`
- Active/Primary: `text-indigo-600`
- Success: `text-green-600`
- Warning: `text-amber-600`
- Error: `text-red-600`

---

### Badge

**Usage**: Status indicators, counts, labels

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
  New
</span>
```

**Specifications**:
- Display: `inline-flex items-center`
- Padding: `px-2.5 py-0.5`
- Border radius: `rounded-full`
- Text: `text-xs font-medium`
- Background: Semantic color based on type

**Variants**:

```tsx
// Success Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Confirmed
</span>

// Warning Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
  Limited Availability
</span>

// Error Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
  Unavailable
</span>

// Neutral Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
  Pending
</span>

// Badge with Dot
<span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
  <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
  <span>Available Now</span>
</span>

// Count Badge
<span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium bg-indigo-600 text-white">
  3
</span>
```

---

### Rating Stars

**Usage**: Display provider ratings

```tsx
<div className="flex items-center space-x-1">
  {/* 5 stars */}
  <svg className="w-4 h-4 text-amber-500 fill-current">
    {/* Filled star */}
  </svg>
  <svg className="w-4 h-4 text-amber-500 fill-current">
    {/* Filled star */}
  </svg>
  <svg className="w-4 h-4 text-amber-500 fill-current">
    {/* Filled star */}
  </svg>
  <svg className="w-4 h-4 text-amber-500 fill-current">
    {/* Filled star */}
  </svg>
  <svg className="w-4 h-4 text-slate-300 fill-current">
    {/* Empty star */}
  </svg>
  <span className="ml-1 text-sm font-medium text-gray-800">4.8</span>
  <span className="text-sm text-slate-500">(124)</span>
</div>
```

**Specifications**:
- Star size: `w-4 h-4`
- Filled: `text-amber-500 fill-current`
- Empty: `text-slate-300 fill-current`
- Spacing: `space-x-1`
- Rating number: `text-sm font-medium text-gray-800`
- Review count: `text-sm text-slate-500` in parentheses

---

## Time Slot Selectors

### Time Slot Grid

**Usage**: Select appointment times

```tsx
<div className="mb-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-3">
    Select a Time
  </h3>
  <div className="grid grid-cols-3 gap-2">
    {/* Available slot */}
    <button className="px-4 py-3 text-base font-medium text-gray-800 bg-white border border-slate-300 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors">
      9:00 AM
    </button>

    {/* Selected slot */}
    <button className="px-4 py-3 text-base font-medium text-white bg-indigo-600 border-2 border-indigo-600 rounded-lg shadow-sm">
      10:30 AM
    </button>

    {/* Unavailable slot */}
    <button className="px-4 py-3 text-base font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed" disabled>
      12:00 PM
    </button>
  </div>
</div>
```

**Specifications**:
- Grid: `grid grid-cols-3 gap-2` (3 columns on desktop)
- Available: White background, slate border, hover indigo
- Selected: Indigo background, white text, indigo border
- Unavailable: Gray background, gray text, disabled

**Responsive**:
```tsx
// Responsive grid
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
  {/* Time slots */}
</div>
```

---

### Date Picker

**Usage**: Select appointment date

```tsx
<div className="mb-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-3">
    Select a Date
  </h3>
  <div className="flex space-x-2 overflow-x-auto pb-2">
    {/* Today - Available */}
    <button className="flex-shrink-0 px-4 py-3 text-center border border-slate-300 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors">
      <div className="text-xs text-slate-600 mb-1">Today</div>
      <div className="text-lg font-semibold text-gray-800">Dec 21</div>
      <div className="text-xs text-slate-600 mt-1">Mon</div>
    </button>

    {/* Tomorrow - Selected */}
    <button className="flex-shrink-0 px-4 py-3 text-center bg-indigo-600 border-2 border-indigo-600 rounded-lg shadow-sm">
      <div className="text-xs text-indigo-200 mb-1">Tomorrow</div>
      <div className="text-lg font-semibold text-white">Dec 22</div>
      <div className="text-xs text-indigo-200 mt-1">Tue</div>
    </button>

    {/* Future date */}
    <button className="flex-shrink-0 px-4 py-3 text-center border border-slate-300 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors">
      <div className="text-xs text-slate-600 mb-1">&nbsp;</div>
      <div className="text-lg font-semibold text-gray-800">Dec 23</div>
      <div className="text-xs text-slate-600 mt-1">Wed</div>
    </button>
  </div>
</div>
```

**Specifications**:
- Container: `flex space-x-2 overflow-x-auto` (horizontal scroll on mobile)
- Button: `flex-shrink-0` (prevents compression)
- Padding: `px-4 py-3`
- Available: White background, slate border, hover indigo
- Selected: Indigo background, white text

---

## Status Indicators

### Success Message

**Usage**: Confirmation after booking, success notifications

```tsx
<div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">
    {/* Success checkmark icon */}
  </svg>
  <div>
    <p className="text-sm font-medium text-green-800 mb-1">
      Booking confirmed!
    </p>
    <p className="text-sm text-green-700">
      Your appointment has been scheduled successfully.
    </p>
  </div>
</div>
```

**Specifications**:
- Padding: `p-4`
- Background: `bg-green-50`
- Border: `border border-green-200`
- Border radius: `rounded-lg`
- Icon: `w-5 h-5 text-green-600`
- Title: `text-sm font-medium text-green-800`
- Body: `text-sm text-green-700`

---

### Error Message

**Usage**: Error notifications, validation errors

```tsx
<div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">
    {/* Error X icon */}
  </svg>
  <div>
    <p className="text-sm font-medium text-red-800 mb-1">
      Booking failed
    </p>
    <p className="text-sm text-red-700">
      This time slot is no longer available. Please select another time.
    </p>
  </div>
</div>
```

**Specifications**:
- Same structure as success, using red colors
- Background: `bg-red-50`
- Border: `border border-red-200`
- Icon: `text-red-600`
- Title: `text-red-800`
- Body: `text-red-700`

---

### Warning Message

**Usage**: Important notices, cautionary information

```tsx
<div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5">
    {/* Warning icon */}
  </svg>
  <div>
    <p className="text-sm font-medium text-amber-800 mb-1">
      Limited availability
    </p>
    <p className="text-sm text-amber-700">
      This provider only has 2 time slots remaining today.
    </p>
  </div>
</div>
```

**Specifications**:
- Background: `bg-amber-50`
- Border: `border border-amber-200`
- Icon: `text-amber-600`
- Title: `text-amber-800`
- Body: `text-amber-700`

---

### Info Message

**Usage**: Helpful information, tips, neutral notifications

```tsx
<div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
    {/* Info icon */}
  </svg>
  <div>
    <p className="text-sm font-medium text-blue-800 mb-1">
      Tip
    </p>
    <p className="text-sm text-blue-700">
      You can save time by providing more details upfront.
    </p>
  </div>
</div>
```

**Specifications**:
- Background: `bg-blue-50`
- Border: `border border-blue-200`
- Icon: `text-blue-600`
- Title: `text-blue-800`
- Body: `text-blue-700`

---

## Modals & Overlays

### Modal

**Usage**: Confirmations, forms, detailed information

```tsx
{/* Backdrop */}
<div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
  {/* Modal */}
  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <h2 className="text-2xl font-semibold text-gray-800">
        Cancel Booking?
      </h2>
      <button className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors">
        <svg className="w-5 h-5">
          {/* X icon */}
        </svg>
      </button>
    </div>

    {/* Content */}
    <p className="text-base text-gray-800 mb-6">
      Are you sure you want to cancel your booking with Mike's Plumbing?
      This action cannot be undone.
    </p>

    {/* Actions */}
    <div className="flex space-x-3">
      <button className="flex-1 px-5 py-2.5 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors">
        Keep Booking
      </button>
      <button className="flex-1 px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
        Cancel Booking
      </button>
    </div>
  </div>
</div>
```

**Specifications**:
- Backdrop: `fixed inset-0 bg-gray-900 bg-opacity-50 z-50`
- Modal: `bg-white rounded-xl shadow-xl max-w-md w-full`
- Padding: `p-6`
- Centered: `flex items-center justify-center`
- Responsive padding: `p-4` on backdrop for mobile spacing

**Variants**:

```tsx
// Large Modal
<div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
  {/* Content */}
</div>

// Full Screen on Mobile
<div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 sm:rounded-xl max-h-[90vh] overflow-y-auto">
  {/* Content */}
</div>
```

---

### Toast Notification

**Usage**: Brief notifications, confirmations, temporary alerts

```tsx
<div className="fixed top-4 right-4 z-50 animate-slide-in-right">
  <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md">
    <div className="flex items-start space-x-3">
      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">
        {/* Success icon */}
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800 mb-1">
          Booking confirmed
        </p>
        <p className="text-sm text-slate-600">
          Your appointment is scheduled for Tuesday at 2:00 PM
        </p>
      </div>
      <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
        <svg className="w-4 h-4">
          {/* X icon */}
        </svg>
      </button>
    </div>
  </div>
</div>
```

**Specifications**:
- Position: `fixed top-4 right-4 z-50`
- Background: `bg-white`
- Border: `border border-slate-200`
- Shadow: `shadow-lg`
- Min width: `min-w-[300px]`
- Max width: `max-w-md`
- Animation: Slide in from right

**Variants**:

```tsx
// Success Toast
<div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4">
  {/* Green themed content */}
</div>

// Error Toast
<div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
  {/* Red themed content */}
</div>

// Info Toast
<div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4">
  {/* Blue themed content */}
</div>
```

---

## Navigation

### Header

**Usage**: Main app header with branding and actions

```tsx
<header className="sticky top-0 z-40 bg-white border-b border-slate-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          {/* Logo icon */}
        </div>
        <span className="text-xl font-semibold text-gray-800">
          ServiceBook
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-5 h-5">
            {/* Menu icon */}
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>
```

**Specifications**:
- Position: `sticky top-0 z-40`
- Background: `bg-white`
- Border: `border-b border-slate-200`
- Height: `h-16` (64px)
- Max width: `max-w-7xl mx-auto` with responsive padding

---

### Tab Navigation

**Usage**: Switch between sections or views

```tsx
<div className="border-b border-slate-200">
  <nav className="flex space-x-6">
    {/* Active tab */}
    <button className="px-1 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">
      Upcoming
    </button>

    {/* Inactive tabs */}
    <button className="px-1 py-3 text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-gray-800 hover:border-slate-300 transition-colors">
      Past
    </button>

    <button className="px-1 py-3 text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-gray-800 hover:border-slate-300 transition-colors">
      Saved
    </button>
  </nav>
</div>
```

**Specifications**:
- Active: `text-indigo-600 border-b-2 border-indigo-600`
- Inactive: `text-slate-600 border-b-2 border-transparent`
- Hover: `hover:text-gray-800 hover:border-slate-300`
- Text: `text-sm font-medium`
- Padding: `px-1 py-3`

---

## Lists

### Simple List

**Usage**: Basic information lists

```tsx
<ul className="space-y-2">
  <li className="flex items-start space-x-2">
    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5">
      {/* Checkmark icon */}
    </svg>
    <span className="text-base text-gray-800">
      24/7 emergency service available
    </span>
  </li>
  <li className="flex items-start space-x-2">
    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5">
      {/* Checkmark icon */}
    </svg>
    <span className="text-base text-gray-800">
      Licensed and insured professionals
    </span>
  </li>
  <li className="flex items-start space-x-2">
    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5">
      {/* Checkmark icon */}
    </svg>
    <span className="text-base text-gray-800">
      Same-day appointments available
    </span>
  </li>
</ul>
```

**Specifications**:
- Container: `space-y-2` (8px between items)
- Item: `flex items-start space-x-2`
- Icon: `w-5 h-5 text-indigo-600 flex-shrink-0`
- Text: `text-base text-gray-800`

---

### Description List

**Usage**: Key-value pairs, booking details

```tsx
<dl className="space-y-3">
  <div>
    <dt className="text-sm text-slate-600 mb-1">Service</dt>
    <dd className="text-base font-medium text-gray-800">Emergency Plumbing</dd>
  </div>

  <div>
    <dt className="text-sm text-slate-600 mb-1">Provider</dt>
    <dd className="text-base font-medium text-gray-800">Mike's Plumbing Service</dd>
  </div>

  <div>
    <dt className="text-sm text-slate-600 mb-1">Date & Time</dt>
    <dd className="text-base font-medium text-gray-800">Tuesday, Dec 21 at 2:00 PM</dd>
  </div>
</dl>
```

**Specifications**:
- Container: `space-y-3` (12px between items)
- Term (dt): `text-sm text-slate-600 mb-1`
- Definition (dd): `text-base font-medium text-gray-800`

---

## Dividers & Spacers

### Horizontal Divider

**Usage**: Separate sections visually

```tsx
{/* Default divider */}
<hr className="border-slate-200 my-6" />

{/* With text */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-slate-200"></div>
  </div>
  <div className="relative flex justify-center">
    <span className="px-3 bg-white text-sm text-slate-600">
      Or
    </span>
  </div>
</div>
```

**Specifications**:
- Simple: `border-slate-200 my-6`
- With text: Centered text with lines on both sides

---

### Spacer

**Usage**: Add consistent vertical spacing

```tsx
{/* Extra small - 8px */}
<div className="h-2" />

{/* Small - 16px */}
<div className="h-4" />

{/* Medium - 24px */}
<div className="h-6" />

{/* Large - 32px */}
<div className="h-8" />

{/* Extra large - 48px */}
<div className="h-12" />
```

---

## Feedback Components

### Empty State

**Usage**: No results, no bookings yet

```tsx
<div className="flex flex-col items-center justify-center py-12 px-4">
  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
    <svg className="w-8 h-8 text-slate-400">
      {/* Empty state icon */}
    </svg>
  </div>
  <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
    No bookings yet
  </h3>
  <p className="text-base text-slate-600 mb-6 text-center max-w-sm">
    When you book a service, you'll see all your appointments here.
  </p>
  <button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
    Find a Service
  </button>
</div>
```

**Specifications**:
- Container: `flex flex-col items-center justify-center py-12 px-4`
- Icon container: `w-16 h-16 bg-slate-100 rounded-full`
- Icon: `w-8 h-8 text-slate-400`
- Title: `text-lg font-semibold text-gray-800`
- Description: `text-base text-slate-600 max-w-sm text-center`
- Action button: Primary button

---

### Error State

**Usage**: Failed requests, unavailable content

```tsx
<div className="flex flex-col items-center justify-center py-12 px-4">
  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
    <svg className="w-8 h-8 text-red-600">
      {/* Error icon */}
    </svg>
  </div>
  <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
    Something went wrong
  </h3>
  <p className="text-base text-slate-600 mb-6 text-center max-w-sm">
    We couldn't load the providers. Please try again.
  </p>
  <button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
    Try Again
  </button>
</div>
```

**Specifications**:
- Same structure as empty state
- Icon container: `bg-red-100`
- Icon: `text-red-600`

---

## Responsive Utilities

### Breakpoints

Tailwind's default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Common Responsive Patterns

```tsx
{/* Hidden on mobile, visible on desktop */}
<div className="hidden md:block">
  Desktop content
</div>

{/* Visible on mobile, hidden on desktop */}
<div className="block md:hidden">
  Mobile content
</div>

{/* Responsive grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

{/* Responsive padding */}
<div className="px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

{/* Responsive text */}
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Heading
</h1>

{/* Responsive flex direction */}
<div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
  {/* Items */}
</div>
```

---

## Accessibility Guidelines

### Focus States

All interactive elements must have clear focus states:

```tsx
{/* Button with focus state */}
<button className="... focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
  Button
</button>

{/* Input with focus state */}
<input className="... focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600" />
```

### Color Contrast

- Ensure minimum WCAG AA contrast ratios:
  - Normal text (< 18pt): 4.5:1
  - Large text (≥ 18pt or 14pt bold): 3:1
  - UI components: 3:1

### Touch Targets

- Minimum touch target size: 44x44px
- Use padding to increase touch area for small elements

### Screen Reader Support

```tsx
{/* Accessible button */}
<button aria-label="Close modal">
  <svg className="w-5 h-5">
    {/* X icon */}
  </svg>
</button>

{/* Accessible loading state */}
<div role="status" aria-live="polite">
  <span className="sr-only">Loading...</span>
  <div className="spinner"></div>
</div>

{/* Accessible form */}
<label htmlFor="location" className="...">
  Your Location
</label>
<input
  id="location"
  type="text"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "location-error" : undefined}
/>
{hasError && (
  <p id="location-error" className="text-sm text-red-600">
    Please enter a valid location
  </p>
)}
```

---

## Animation & Transitions

### Default Transitions

Use consistent transition durations:

```tsx
{/* Fast (UI feedback) - 150ms */}
<button className="... transition-colors duration-150">

{/* Standard (most UI) - 200ms */}
<button className="... transition-colors duration-200">

{/* Slow (complex animations) - 300ms */}
<div className="... transition-all duration-300">
```

### Common Animations

```css
/* Add to global CSS or Tailwind config */

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## Component Composition Examples

### Chat Interface Layout

```tsx
<div className="flex flex-col h-screen bg-slate-50">
  {/* Header */}
  <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
    <div className="max-w-4xl mx-auto px-4 py-4">
      <h1 className="text-xl font-semibold text-gray-800">
        Service Booking Assistant
      </h1>
    </div>
  </header>

  {/* Messages Container */}
  <div className="flex-1 overflow-y-auto">
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Timestamp */}
      <div className="flex justify-center mb-6">
        <span className="px-3 py-1 text-xs text-slate-500 bg-slate-100 rounded-full">
          Today at 2:34 PM
        </span>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[70%] px-4 py-3 bg-indigo-600 text-white rounded-2xl rounded-tr-sm">
            <p className="text-base leading-relaxed">
              I need a plumber
            </p>
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex justify-start">
          <div className="max-w-[70%] px-4 py-3 bg-slate-50 text-gray-800 rounded-2xl rounded-tl-sm border border-slate-200">
            <p className="text-base leading-relaxed">
              I can help you find a plumber. What's your location?
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Input Area */}
  <div className="sticky bottom-0 bg-white border-t border-slate-200">
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 text-base text-gray-800 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
        />
        <button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Send
        </button>
      </div>
    </div>
  </div>
</div>
```

---

### Provider Search Results Layout

```tsx
<div className="max-w-4xl mx-auto px-4 py-6">
  {/* Header */}
  <div className="mb-6">
    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
      Available Plumbers in 94103
    </h2>
    <p className="text-base text-slate-600">
      Found 5 top-rated providers near you
    </p>
  </div>

  {/* Filters (optional) */}
  <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
    <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg whitespace-nowrap">
      All
    </button>
    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors whitespace-nowrap">
      Available Today
    </button>
    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors whitespace-nowrap">
      Highest Rated
    </button>
  </div>

  {/* Provider Cards */}
  <div className="space-y-4">
    {/* Repeat for each provider */}
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer">
      {/* Provider card content */}
    </div>
  </div>
</div>
```

---

### Booking Confirmation Layout

```tsx
<div className="max-w-2xl mx-auto px-4 py-8">
  {/* Success Header */}
  <div className="text-center mb-8">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-green-600">
        {/* Success checkmark */}
      </svg>
    </div>
    <h1 className="text-3xl font-bold text-gray-800 mb-2">
      You're All Set!
    </h1>
    <p className="text-lg text-slate-600">
      Your booking has been confirmed
    </p>
  </div>

  {/* Booking Details Card */}
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
    <h2 className="text-lg font-semibold text-gray-800 mb-4">
      Booking Details
    </h2>

    <dl className="space-y-3">
      <div>
        <dt className="text-sm text-slate-600 mb-1">Service</dt>
        <dd className="text-base font-medium text-gray-800">Emergency Plumbing</dd>
      </div>

      <div>
        <dt className="text-sm text-slate-600 mb-1">Provider</dt>
        <dd className="text-base font-medium text-gray-800">Mike's Plumbing Service</dd>
      </div>

      <div>
        <dt className="text-sm text-slate-600 mb-1">Date & Time</dt>
        <dd className="text-base font-medium text-gray-800">Tuesday, Dec 21 at 2:00 PM</dd>
      </div>

      <div>
        <dt className="text-sm text-slate-600 mb-1">Location</dt>
        <dd className="text-base font-medium text-gray-800">123 Main St, San Francisco, CA 94103</dd>
      </div>
    </dl>
  </div>

  {/* Info Message */}
  <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
      {/* Info icon */}
    </svg>
    <p className="text-sm text-blue-700">
      A confirmation email has been sent to your inbox, and the appointment has been added to your calendar.
    </p>
  </div>

  {/* Actions */}
  <div className="flex flex-col sm:flex-row gap-3">
    <button className="flex-1 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
      Book Another Service
    </button>
    <button className="flex-1 px-5 py-2.5 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors">
      View My Bookings
    </button>
  </div>
</div>
```

---

## Implementation Checklist

When implementing a new component:

- [ ] Use appropriate semantic HTML elements
- [ ] Include all specified Tailwind classes
- [ ] Add focus states for interactive elements
- [ ] Ensure proper color contrast (WCAG AA)
- [ ] Add appropriate ARIA labels and roles
- [ ] Test keyboard navigation
- [ ] Verify touch targets are at least 44x44px
- [ ] Test responsive behavior on mobile, tablet, desktop
- [ ] Add loading and error states where applicable
- [ ] Use consistent spacing from 8px grid
- [ ] Apply appropriate transitions (150-300ms)
- [ ] Match typography hierarchy from brand strategy
- [ ] Use brand colors (indigo, amber, semantic colors)
- [ ] Test with screen readers

---

*This component library is a living document. Update as new components are added or existing ones are refined.*

**Version**: 1.0
**Last Updated**: December 2024

# Design Guidelines: Bíblia Hebraico & Grego – Primeiros Textos + IA

## Design Philosophy

**Visual Identity**: Azul metálico (metallic blue) theme conveying depth, wisdom, technological modernity, and theological trust. The design must balance modern aesthetics with conservative reliability.

**Core Principles**:
- Extremely intuitive navigation
- Organized, clean layouts with zero visual pollution
- Premium feel with purposeful restraint
- Clear information hierarchy
- Accessibility and readability first

## Color Palette Approach

**Primary Theme**: Metallic blue gradient system
- Deep metallic blues for headers and primary actions
- Lighter blue tints for backgrounds and secondary elements
- High contrast dark mode with blue accents
- White/off-white for text content areas
- Subtle metallic sheen effects on interactive elements

**Accessibility**: Maintain WCAG AA compliance with 4.5:1 contrast ratios for all text.

## Typography System

**Font Strategy**:
- **Primary Font**: Inter or SF Pro (system fonts for native feel) - for UI elements, navigation, buttons
- **Reading Font**: Charter, Crimson Pro, or similar serif - optimized for extended biblical text reading
- **Accent Font**: Same as primary, medium/semibold weights for emphasis

**Type Scale**:
- Headings: 24px (Book titles), 20px (Chapter headers), 18px (Section headers)
- Body Text: 16-18px (biblical text - larger for comfortable reading)
- UI Text: 14px (navigation, labels), 12px (metadata, footnotes)
- Small Text: 11px (verse numbers, Strong references)

**Reading Optimization**: 
- Line height: 1.6-1.8 for biblical text
- Comfortable line length: 60-75 characters
- Generous paragraph spacing for verse separation

## Layout System

**Spacing Units**: Use consistent 4px-based scale
- Micro: 4px, 8px (tight spacing, verse numbers)
- Small: 12px, 16px (component padding, list items)
- Medium: 24px, 32px (section spacing, card padding)
- Large: 40px, 48px (screen margins, major sections)

**Screen Structure**:
- Top Navigation: 56px height (book/chapter selector)
- Content Area: Scrollable, full width with 16px side padding
- Fixed Bottom: 72px AI input section (always visible)
- Safe Areas: Respect iOS/Android notches and home indicators

## Component Library

### Primary Screens

**1. Splash Screen**:
- Full-screen metallic blue gradient
- Centered app logo (sophisticated, theological symbolism)
- Subtle shimmer animation on load
- App name in elegant serif typography

**2. Authentication (Login/Register)**:
- Minimal, centered card design
- Blue metallic header with logo
- Clean form fields with clear labels
- Primary CTA buttons with metallic blue gradient
- Social auth options if applicable
- "Forgot password" link subtle but accessible

**3. Bible Reading Screen (MAIN)**:

**Top Bar** (56px):
- Book dropdown (left) - "Gênesis", "Êxodo", etc.
- Chapter selector (right) - horizontal scroll or dropdown
- Settings icon (far right)
- Bookmark icon
- Search icon

**Content Area**:
- Verse-by-verse layout with clear verse numbers
- Tap on verse highlights with blue tint
- Tap word for Strong modal (see below)
- Markers/annotations shown as subtle icons inline
- Smooth scroll with chapter transitions

**Fixed Bottom AI Panel** (72px collapsed):
- Input field: "Pergunte ao Professor Teológico..."
- Send button with AI icon (blue metallic)
- Expandable panel slides up showing AI response
- Response panel: white background, blue accents, scrollable
- Close button to collapse back to input field

**4. Strong Dictionary Modal**:
- Slide-up modal (60% screen height)
- Word at top in original Hebrew/Greek script
- Strong number clearly displayed
- Definition with clear typography hierarchy
- Root etymology section
- Morphology breakdown
- "Close" button or swipe-down gesture

**5. Subscription Screen**:
- Three cards in vertical scroll:
  * Strong Vitalício - R$ 189,90 (one-time, highlighted as "best value")
  * IA Essencial - R$ 19,90/mês
  * IA Premium - R$ 49,90/mês
- Each card shows features with checkmarks
- Clear CTA buttons per plan
- Trial status banner if active (e.g., "15 dias restantes")
- Lock icons on restricted features

**6. Settings Screen**:
- Grouped list design
- Sections: Conta, Aparência, Leitura, Assinatura, Sobre
- Toggle switches for dark mode, font size
- Profile info at top with avatar
- Logout button at bottom (red, destructive)

**7. AI History Screen**:
- Chronological list of past AI interactions
- Each item: question preview + date + verse reference
- Tap to expand full response
- Search/filter by date or book
- Clear all history option

### UI Components

**Buttons**:
- Primary: Metallic blue gradient, white text, rounded corners (8px)
- Secondary: Outline style, blue border, blue text
- Destructive: Red for logout/delete actions
- Ghost: Text-only for tertiary actions

**Cards**:
- Subtle shadow (elevation 2)
- 12px border radius
- White background (light mode), dark blue (dark mode)
- 16px internal padding

**Icons**:
- Use Ionicons or React Native Vector Icons
- 24px for navigation, 20px for inline actions
- Consistent stroke width, minimal style
- Blue tint for active states

**Modals/Sheets**:
- Bottom sheet pattern for Strong, filters
- Overlay with 40% dark scrim
- Rounded top corners (16px)
- Drag indicator at top

**Form Inputs**:
- 48px height for touch targets
- Clear labels above fields
- Blue underline on focus
- Error states in red with helper text

## Navigation Pattern

**Bottom Tab Navigation** (if applicable):
- Home (Bible reading)
- Search
- Bookmarks
- Settings
- 5 tabs max for clarity

OR **Drawer Navigation**:
- Hamburger menu (top left)
- Slide-out panel with:
  * Bíblia
  * Histórico IA
  * Assinaturas
  * Configurações
  * Ajuda

## Animations

**Use Sparingly**:
- Smooth transitions between screens (300ms ease)
- Modal slide-up animations
- AI panel expand/collapse
- Loading states with subtle blue spinner
- Avoid distracting decorative animations

**Focus on Micro-interactions**:
- Button press states (scale 0.95)
- Toggle switches
- Verse highlight on tap

## Dark Mode Considerations

- Deep blue-black backgrounds (#0A1929)
- Metallic blue accents remain vibrant
- White text at 90% opacity for reduced eye strain
- Dimmed images/illustrations
- Toggle in settings for user control

## Accessibility

- Minimum 44x44px touch targets
- VoiceOver/TalkBack support on all interactive elements
- Semantic headings for screen readers
- High contrast mode compliance
- Font scaling support (user can increase text size)

## Key Differentiators

1. **AI Integration**: Always accessible at bottom of reading screen - not a separate section
2. **Strong Dictionary**: Seamless tap-to-define within biblical text
3. **Premium Feel**: Metallic blue theme conveys both modernity and theological depth
4. **Trial System**: Clear visual indicators of trial status and locked features
5. **Reading Focus**: Distraction-free biblical text with tools one tap away

---

**Visual Tone**: Sophisticated, trustworthy, modern yet reverent. Think of Apple's design restraint combined with theological gravitas. Every element serves the primary purpose: deep engagement with biblical texts enhanced by AI wisdom.
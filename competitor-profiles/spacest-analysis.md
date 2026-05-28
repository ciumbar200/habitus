# Spacest.com — Competitor Analysis & Action Plan

**Generated:** 2026-05-27
**Depth:** Comprehensive UI/UX & Feature Analysis

---

## Executive Summary

Spacest.com is a **mid-to-long-term rental platform** operating across 7 countries (Spain, Italy, Germany, Portugal, France, Netherlands, Austria, Asia). Unlike Moon's **compatibility-first** approach, Spacest focuses on **verified properties, one-click booking, and guaranteed services** for both tenants and landlords.

### Key Differences at a Glance

| Dimension | Moon Shared Living | Spacest.com |
|-----------|-------------------|-------------|
| **Primary Value** | Compatibility matching | Verified properties + easy booking |
| **Target Audience** | Students, expats, professionals seeking compatible flatmates | Students, workers, families, professionals |
| **Geographic Focus** | Barcelona & Madrid | 7+ countries, 50+ cities |
| **Core Model** | Shared living with compatibility scoring | Individual/family rentals (medium-term) |
| **Booking Flow** | Apply → Chat → Contract | One-click booking with fees |
| **Verification** | Identity verification | Property verification + photos |
| **Revenue Model** | Likely platform fees | Service fees (tenant + landlord) |

---

## What Spacest Does Better

### 1. **Property Verification & Trust Signals**

**Spacest:**
- All properties personally visited by Spacest team
- "Verified apartments" badge prominently displayed
- Photos guaranteed to match reality
- "Rent with one click" value proposition

**Moon:**
- Has verification badges but less prominent
- Could emphasize the verification aspect more

**Action:** Add a "Verified by Moon" section to homepage and property cards showing verification process.

### 2. **One-Click Booking Philosophy**

**Spacest:**
- Clear "Rent Now" / "Alquila ahora" CTA
- Booking simulation tool to calculate total costs upfront
- Digital-first, streamlined process

**Moon:**
- More complex flow (compatibility → chat → application)
- Multiple steps before booking

**Action:** Consider a "Quick Book" option for verified users who want to skip some steps.

### 3. **Multi-Country, Multi-Language Platform**

**Spacest:**
- 7 languages supported (EN, ES, IT, PT, FR, DE, NL)
- 50+ cities across Europe and Asia
- Localized content per country

**Moon:**
- Spanish-only
- Barcelona & Madrid only

**Action:** Plan for international expansion with proper i18n infrastructure.

### 4. **Clear Value Proposition Hierarchy**

**Spacest Homepage Structure:**
1. Hero: "Find the best home anywhere" + search bar
2. Value proposition: 3 key benefits (verified, one-click, support)
3. Popular cities grid
4. Social proof (reviews)
5. Detailed "How it works" section

**Moon Homepage Structure:**
1. Hero: "Share life, not just walls"
2. Stats (92% compatibility, etc.)
3. Features section
4. "How it works" 4 steps
5. Testimonials

**Action:** Moon's structure is good, but could add an **instant search bar** in hero like Spacest.

### 5. **Guaranteed Services for Landlords**

**Spacest Landlord Features:**
- **Guaranteed Rent** — rent paid even if tenant defaults
- **Damage Coverage** — protection beyond security deposit
- Professional photography, contract drafting, administrative management
- Claims ~€4,700 average savings for landlords

**Moon Landlord Features:**
- Less developed landlord-facing value proposition

**Action:** Build out landlord guarantees and services as a key differentiator.

### 6. **Transparent (if complex) Fee Structure**

**Spacest:**
- Service fee proportional to rental cost + duration
- Booking simulator to calculate total cost
- Fees displayed next to rent price

**Moon:**
- Less clear on fee structure

**Action:** Add a "Fee Calculator" tool to show total costs upfront.

---

## What Moon Does Better (Don't Change)

### 1. **Compatibility-First Matching**
- Moon's unique selling point is the compatibility quiz and scoring
- Spacest has no concept of flatmate compatibility
- This is Moon's core differentiator — **lean into it**

### 2. **Group Rental Features**
- Moon's "Build your group" and "Fair split" features
- Group formation before renting
- Transparent room pricing based on size/features
- Spacest lacks this entirely

### 3. **Human Support Emphasis**
- Moon highlights "24/7 human support"
- Spacest mentions it but less prominently
- Moon's testimonials emphasize personal connection

### 4. **Cleaner, More Modern UI**
- Moon's design feels more contemporary
- Better use of whitespace and typography
- More cohesive brand identity

---

## Recommended Actions (Priority Order)

### 🔴 High Priority (Quick Wins)

#### 1. Add Hero Search Bar
**Spacest has:** Instant search bar in hero with city, neighborhood, and landmark fields
**Moon has:** No search in hero

**Implementation:**
```tsx
// Add to hero section of homepage
<div className="relative z-10 mx-auto max-w-2xl">
  <div className="rounded-2xl bg-white/10 backdrop-blur-md p-2 flex gap-2">
    <input placeholder="Ciudad" className="flex-1 bg-white/10 rounded-xl px-4" />
    <input placeholder="Barrio, universidad..." className="flex-1 bg-white/10 rounded-xl px-4" />
    <button className="bg-teal-accent px-6 rounded-xl">Buscar</button>
  </div>
</div>
```

#### 2. Prominent Verification Badges
**Spacest has:** "Verified apartments" section with icons
**Moon has:** Badges exist but could be more prominent

**Implementation:**
- Add verification section to homepage
- Show verification process (visit → photos → guarantee)
- Add "Verified by Moon" stamp to property cards

#### 3. Transparent Fee Display
**Spacest has:** Fee shown next to rent price
**Moon has:** Less clear

**Implementation:**
```tsx
// On property cards and detail pages
<div className="flex items-center gap-2">
  <span className="text-2xl font-bold">€600</span>
  <span className="text-sm text-gray-500">/mes</span>
  <span className="text-xs text-gray-400">+ €45 tarifa plataforma</span>
</div>
```

#### 4. Landlord Value Proposition Page
**Spacest has:** Detailed landlord services page
**Moon has:** Less developed

**Implementation:**
- Create `/propietarios` landing page
- Highlight: guaranteed rent, damage protection, tenant vetting
- Show landlord savings calculator

### 🟡 Medium Priority (Strategic)

#### 5. Multi-Language Infrastructure
**Spacest has:** 7 languages
**Moon has:** Spanish only

**Implementation:**
- Set up i18n framework (already have `es` in core)
- Add English first (for expat target)
- Plan for Catalan, Italian, Portuguese

#### 6. City-Specific Landing Pages
**Spacest has:** SEO-optimized pages for each city
**Moon has:** Generic explore page

**Implementation:**
- Create `/barcelona`, `/madrid` landing pages
- Local SEO optimization
- City-specific content and testimonials

#### 7. Quick Book Option
**Spacest has:** One-click booking
**Moon has:** Multi-step process

**Implementation:**
- Add "Reserva rápida" option for verified users
- Skip some compatibility checks for returning users
- Maintain compatibility score display

### 🟢 Low Priority (Future Considerations)

#### 8. International Expansion
- Plan for expansion to other Spanish cities first
- Then Portugal, Italy (similar markets)
- Leverage multi-language infrastructure

#### 9. Enhanced Landlord Services
- Professional photography service
- Contract drafting assistance
- Guaranteed rent offering

#### 10. Mobile App Improvements
- Spacest appears web-first
- Moon has mobile app — lean into this advantage

---

## UI/UX Specific Recommendations

### Homepage Changes

**Current Moon Hero:**
- Tagline: "Share life, not just walls"
- Stats: 92% compatibility, etc.
- CTA: "Rent together"

**Recommended Additions:**
1. Add search bar below tagline (Spacest style)
2. Keep compatibility stats but make them more visual
3. Add "Verified properties" count

**Before:**
```
[Tagline]
[Stats]
[CTA]
```

**After:**
```
[Tagline]
[Search Bar: City | Neighborhood | landmark | Search]
[Stats: Verified Properties | Compatible Matches | Happy Users]
[CTA]
```

### Property Card Improvements

**Current Moon Card:**
- Image with compatibility badge
- Property name, location, price
- Amenities
- Host info

**Recommended Additions:**
1. Add verification badge more prominently
2. Show "Available from [date]" if known
3. Add "Response time" indicator
4. Show fee breakdown on hover

### Navigation Improvements

**Current Moon Nav:**
- Explore, Hosts, Owners, How it works, Security

**Spacest Nav:**
- Are you a landlord?, Favorites, Language

**Recommended:**
- Add "Favoritos" quick access
- Add "¿Eres propietario?" CTA in nav
- Keep language selector for future i18n

---

## Copywriting Recommendations

### Spacest's Strong Phrases (Adapt for Moon)

| Spacest Original | Moon Adaptation |
|------------------|-----------------|
| "Rent with one click" | "Encuentra y reserva en minutos" |
| "Verified apartments" | "Espacios verificados por Moon" |
| "Our team visits all apartments" | "Nuestro equipo verifica cada espacio" |
| "24h dedicated to you" | "Soporte humano 24/7" (already have!) |

### Moon's Unique Phrases (Keep & Emphasize)

- "Share life, not just walls" ✅ Keep
- "92% average compatibility" ✅ Keep
- "Choose who you live with, not just where" ✅ Keep

---

## Metrics to Track

Implement these to measure impact of changes:

1. **Homepage Search Bar Usage**
   - % of users who use search vs. browse
   - Search-to-property-view conversion

2. **Verification Badge Impact**
   - Click-through rate on verified vs. non-verified properties
   - User trust signals (survey)

3. **Fee Transparency**
   - Abandonment rate at payment step
   - Support tickets about pricing

4. **Landlord Landing Page**
   - Landlord sign-up conversion
   - Time to first listing

---

## Summary

**Spacest excels at:**
- Trust through verification
- Simplified booking flow
- Multi-country scale
- Landlord services

**Moon excels at:**
- Compatibility matching (unique differentiator)
- Group rental features
- Modern UI/UX
- Human connection

**What to "copy" from Spacest:**
1. ✅ Hero search bar (quick win)
2. ✅ Prominent verification badges
3. ✅ Transparent fee display
4. ✅ Landlord value proposition page
5. ✅ City-specific landing pages (SEO)
6. ✅ Multi-language infrastructure (prepare for expansion)

**What NOT to copy:**
- Don't lose the compatibility-first positioning
- Don't simplify the matching process too much
- Don't become just another rental platform

**Key Insight:** Moon's compatibility focus is its unique advantage. Use Spacest's trust and simplicity tactics as a layer ON TOP of Moon's core compatibility offering, not instead of it.

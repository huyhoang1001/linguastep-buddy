# Implementation Plan — Full-Page Diagnostic Exam Mode

Convert the existing Diagnostic Assessment from a constrained modal experience into a dedicated, focused full-screen workspace. This refactor prioritizes question visibility, reduces vertical scrolling, and provides a clear "Save & Pause" workflow.

## User Review & Critical Decisions

> [!IMPORTANT]
> The diagnostic assessment will now hide the main application navigation and sidebar to ensure maximum focus. Users can exit this "Exam Mode" at any time using the **Save & Pause** action.

- **Confirmed Decision (Phase 1)**: Instant full-page transition when starting the diagnostic from onboarding.
- **Confirmed Decision (Phase 1)**: Fixed sticky top bar for progress and session controls.
- **Confirmed Decision (Phase 1)**: Landing on the Home Dashboard with a "Resume" banner after pausing.

## 1. Overview & Core Concept

- **What It Does**: Transitions the assessment from a `max-h-[85vh]` scrollable card into a full-page view using the browser's natural scroll.
- **Key Value**: Reduces "UI overhead" (large cards, redundant section info) and places the question and answer options "above the fold" on most laptop screens.
- **Target Audience**: New learners completing onboarding and existing users retaking assessments.

## 2. User Experience & Visual Design

- **Exam Header (Compact & Sticky)**:
    - **Zone 1 (Left)**: Assessment Mode Title (e.g., "Standard Diagnostic") + Current Section name.
    - **Zone 2 (Center)**: Question count (e.g., "Item 4 of 20") + Timer.
    - **Zone 3 (Right)**: **Save & Pause** button + **Complete** (when eligible).
    - **Indicator**: A thin (2px-4px) primary-colored progress bar attached to the bottom of the header.

- **Question-First Layout**:
    - Centered readable content width (`max-w-3xl` or `768px`).
    - Standard multiple-choice options will use a grid or list with reduced vertical gaps.
    - Reading passages and Writing inputs will scroll naturally with the page, avoiding nested scrollbars.

- **Responsive Adaptations**:
    - **Desktop**: Centered content with generous horizontal margins.
    - **Mobile**: Full-width content, sticky header reduces to icons + progress if space is tight.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: View Management in App.tsx**
    - *Chosen Approach*: Add `diagnostic` as a valid navigation destination.
    - *Why*: Allows `App.tsx` to conditionally hide the global `Header` and render the `AdaptiveDiagnosticView` as the primary screen.
- **Decision 2: Save & Resume Logic**
    - *Chosen Approach*: Maintain current IndexedDB persistence but add a "Resume Assessment" banner to the `HomeScreen`.
    - *Why*: Users might close the browser or click "Save & Pause". A prominent home banner ensures they don't lose their progress.

## 4. Technical Architecture & Data Strategy

```text
┌─────────────────────────────────────────────────────────┐
│                       App.tsx                           │
│ (State: navigationDestination = 'diagnostic' | 'home')  │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
    ┌────────▼────────┐          ┌────────▼────────────────┐
    │  Global Header  │          │ AdaptiveDiagnosticView  │
    │ (Hidden in Diag)│          │      (Full Page)        │
    └─────────────────┘          └────────┬────────────────┘
                                          │
                         ┌────────────────▼────────────────┐
                         │      DiagnosticCompactHeader    │
                         │ (Sticky Top, Progress, Timer)   │
                         └─────────────────────────────────┘
```

### State Mutations & Transitions:
1. **Start**: `OnboardingModal` calls `onStartDiagnostic` -> `App.tsx` sets `nav = 'diagnostic'` and hides `OnboardingModal`.
2. **Action**: `AdaptiveDiagnosticView` manages its own internal question fetching and evaluation as it does today.
3. **Pause**: `onPaused` callback -> `App.tsx` sets `nav = 'home'`, `OnboardingModal` remains closed.
4. **Resume**: `HomeScreen` detects existing session -> "Resume" button -> `App.tsx` sets `nav = 'diagnostic'`.

## 5. Verification Plan

### Automated Tests:
- `test/diagnostic_navigation.test.ts`: Verify full-page render and header visibility.
- `test/persistence.test.ts`: Verify Save & Pause restores exact question state and timer.
- `test/responsiveness.test.ts`: Verify no horizontal overflow on 375px viewports.

### Manual Verification:
- [ ] Open onboarding -> Discovery -> Start Assessment (check page transition).
- [ ] Answer 3 questions -> Refresh browser (check auto-resume).
- [ ] Save & Pause -> Verify "Resume" banner on home.
- [ ] Complete assessment -> Check transition to Report screen.

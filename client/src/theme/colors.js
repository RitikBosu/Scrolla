/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           SCROLLA — CENTRALIZED COLOR DESIGN TOKENS          ║
 * ║  Following the 60-30-10 rule:                                ║
 * ║    60% → Backgrounds  (Off-white / light gray)               ║
 * ║    30% → Surfaces     (Soft blue / teal)                     ║
 * ║    10% → Accents      (Mindful green, warm alerts)           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ============================================================
// 60% — Dominant / Background Layer
// ============================================================
export const background = {
  /** Main background */
  primary: '#FAFBFC',
  /** Subtle surfaces */
  secondary: '#F5F6F8',
  /** Lower contrast areas */
  tertiary: '#EEEEF0',
  /** Light mode primary */
  lightPrimary: '#FAFBFC',
  /** Light mode secondary */
  lightSecondary: '#F5F6F8',
};

// ============================================================
// 30% — Surface / Container Layer
// ============================================================
export const surface = {
  /** Card backgrounds */
  blue: '#E3F2FD',
  /** Alternative surface */
  teal: '#DFFCF0',
  /** Relaxation vibe */
  lavender: '#F3E5F5',
  /** Default fallback */
  default: '#E3F2FD',
  /** Raised surface */
  raised: '#DFFCF0',
  /** Light mode card */
  light: '#FFFFFF',
};

// ============================================================
// 10% — Accent / Interactive Layer
// ============================================================
export const accent = {
  /** Main CTA (mindful green) */
  primary: '#52C77A',
  /** Success states */
  success: '#4CAF50',
  /** Notifications */
  warning: '#FFC107',
  /** Errors, unfollows */
  danger: '#FF6B6B',
  /** Info messages */
  info: '#2196F3',
  /** Secondary CTA */
  secondary: '#3B82F6',
  /** Dark variant */
  dark: '#3E9E61',
  /** Digital gold (legacy mapping) */
  gold: '#FFC107',
};

// ============================================================
// Text Colors — WCAG AA compliant pairings
// ============================================================
export const text = {
  /** Main text (almost black) */
  primary: '#1A1A1A',
  /** Supporting text */
  secondary: '#6B7280',
  /** Hints, labels */
  tertiary: '#9CA3AF',
  /** Text on dark/colored backgrounds */
  inverse: '#FFFFFF',
  /** Light mode primary */
  lightPrimary: '#1A1A1A',
  /** Light mode secondary */
  lightSecondary: '#6B7280',
};

// ============================================================
// Border Colors
// ============================================================
export const border = {
  /** Subtle dividers */
  light: '#E5E7EB',
  /** Normal borders */
  medium: '#D1D5DB',
  /** Prominent borders */
  dark: '#9CA3AF',
  /** Accent border (hover, focus) */
  accent: 'rgba(82, 199, 122, 0.4)',
  /** Light mode borders */
  lightMode: '#E5E7EB',
};

// ============================================================
// Semantic Aliases — for consistent UI state feedback
// ============================================================
export const semantic = {
  error: accent.danger,
  success: accent.success,
  warning: accent.warning,
  info: accent.info,
  errorBg: 'rgba(255, 107, 107, 0.1)',
  successBg: 'rgba(76, 175, 80, 0.1)',
  warningBg: 'rgba(255, 193, 7, 0.1)',
  infoBg: 'rgba(33, 150, 243, 0.1)',
};

// ============================================================
// Spacing Scale (rem-based, 4px base unit)
// ============================================================
export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
};

// ============================================================
// Border Radius Scale
// ============================================================
export const radius = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem',
  full: '9999px',
};

// ============================================================
// Typography Scale
// ============================================================
export const typography = {
  fontHeading: "'Sora', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
  size: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem',
  },
};

// ============================================================
// Full theme object — import { colors } from '@/theme/colors'
// ============================================================
export const colors = {
  background,
  surface,
  accent,
  text,
  border,
  semantic,
  spacing,
  radius,
  typography,
};

export default colors;

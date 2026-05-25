// ── Design System ─────────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg:          '#0A0A0F',
  surface:     '#111118',
  card:        '#16161F',
  cardBorder:  '#1E1E2E',
  input:       '#1A1A26',

  // Brand
  primary:     '#7C5CFC',
  primaryDark: '#5B3FD4',
  primaryGlow: 'rgba(124,92,252,0.15)',
  accent:      '#FC5C7D',
  grad:        ['#7C5CFC', '#FC5C7D'],

  // Text
  textPrimary:   '#F0EDF8',
  textSecondary: '#8B87A8',
  textMuted:     '#4A4760',

  // Status
  success:     '#22D3A5',
  successBg:   'rgba(34,211,165,0.12)',
  warning:     '#F59E0B',
  warningBg:   'rgba(245,158,11,0.12)',
  danger:      '#F87171',
  dangerBg:    'rgba(248,113,113,0.12)',

  // Borders
  border:      '#1E1E2E',
  borderLight: '#252535',
}

export const typography = {
  h1:    { fontSize: 28, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  h2:    { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  h3:    { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body:  { fontSize: 15, fontWeight: '400', color: colors.textSecondary, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  mono:  { fontSize: 13, fontFamily: 'monospace', color: colors.primary },
}

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
}

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primary: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
}
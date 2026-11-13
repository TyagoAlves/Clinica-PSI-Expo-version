// src/theme.ts
// Tokens visuais tirados dos protótipos do Penpot (telas 1–17).
export const colors = {
  bg: '#F1F3F8',        // fundo geral
  surface: '#FFFFFF',   // cartões/inputs
  border: '#E2E8F0',    // borda de inputs, cartões e botões neutros
  divider: '#EEF1F6',   // linhas internas dos cartões
  primary: '#4F46E5',   // indigo do mock (botão, logo, link)
  primaryDark: '#4338CA',
  primarySoft: '#EEF2FF', // fundo de chips/avatares/ícones
  text: '#0F172A',      // títulos
  textMuted: '#64748B', // subtítulos, rodapé
  label: '#1E293B',     // rótulos dos campos (escuros e em negrito no mock)
  placeholder: '#94A3B8',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  success: '#059669',   // "Ativo", "Em tratamento", números verdes
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#B45309',   // "Pausado"
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  drawer: '#111827',    // fundo do menu lateral
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const radius = {
  input: 12,
  button: 12,
  card: 16,
  pill: 999,
};

/** Sombra suave dos cartões. */
export const cardShadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

/** Sombra do botão principal (indigo). */
export const buttonShadow = {
  shadowColor: '#4F46E5',
  shadowOpacity: 0.28,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

/** Estilo base de cartão branco do mock. */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.border,
  ...cardShadow,
} as const;

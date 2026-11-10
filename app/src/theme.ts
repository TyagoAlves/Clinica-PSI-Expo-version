// src/theme.ts
export const colors = {
  bg: '#F1F3F8',        // fundo geral (igual ao mock)
  surface: '#FFFFFF',   // cartões/inputs
  border: '#E2E8F0',    // borda de inputs e botões neutros
  primary: '#4F46E5',   // indigo do mock (botão, logo, link)
  primaryDark: '#4338CA', // hover/pressed (não precisa agora, mas fica registrado)
  text: '#0F172A',      // títulos (quase preto)
  textMuted: '#64748B', // subtítulos, rodapé
  label: '#475569',     // rótulos dos campos
  placeholder: '#94A3B8', // placeholder (no mock o input é branco com texto visível)
  error: '#DC2626',     // erros de validação
  errorBg: '#FEF2F2',   // fundo do alerta de erro
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

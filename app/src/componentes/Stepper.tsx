// src/componentes/Stepper.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export interface Step {
  n: number;
  label: string;
}

interface Props {
  steps: Step[];
  active: number; // índice da etapa ativa (0-based)
}

export default function Stepper({ steps, active }: Props) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Etapas do cadastro">
      {steps.map((step, i) => {
        const isActive = i === active;
        const isDone = i < active;
        return (
          <View
            key={step.n}
            style={[styles.chip, isDone ? styles.done : isActive ? styles.chipActive : null]}
          >
            {isDone ? (
              <Text style={[styles.chipText, styles.chipTextDone]}>✓  {step.label}</Text>
            ) : (
              <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
                {step.n}  {step.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  chip: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
  },
  done: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.10)',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  chipTextDone: { color: '#16A34A' },
});

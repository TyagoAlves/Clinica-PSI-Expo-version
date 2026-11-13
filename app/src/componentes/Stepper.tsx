// src/componentes/Stepper.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

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
          <View key={step.n} style={[styles.chip, isDone ? styles.done : isActive ? styles.chipActive : null]}>
            <Text
              style={[styles.chipText, isDone ? styles.chipTextDone : isActive ? styles.chipTextActive : null]}
              numberOfLines={1}
            >
              {isDone ? `✓ ${step.label}` : `${step.n}  ${step.label}`}
            </Text>
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
    gap: 10,
    marginTop: 4,
    marginBottom: 18,
  },
  chip: {
    flex: 1,
    height: 30,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  done: { borderColor: colors.success, backgroundColor: colors.successBg },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.primary },
  chipTextDone: { color: colors.success },
});

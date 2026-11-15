// src/modais/VerSessaoModal.tsx
// Detalhes de uma sessão (só leitura), com os botões Editar e Excluir.
import { Alert, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import SheetModal from './SheetModal';
import type { Sessao } from '../banco/bancoDados';
import { addMinutes, isoToBr } from '../utils/format';

type Props = {
  /** Sessão aberta (ou null = fechado). */
  sessao: Sessao | null;
  nomePaciente: string;
  onClose: () => void;
  onEditar: () => void;
  onExcluir: () => Promise<void>;
};

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

export default function VerSessaoModal({ sessao, nomePaciente, onClose, onEditar, onExcluir }: Props) {
  const excluir = () =>
    Alert.alert('Excluir sessão?', 'A sessão sai da agenda.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await onExcluir();
          onClose();
        },
      },
    ]);

  return (
    <SheetModal
      visible={sessao !== null}
      title="Detalhes da sessão"
      subtitle={nomePaciente}
      onClose={onClose}
      primaryLabel="Editar sessão"
      onPrimary={onEditar}
      onDelete={excluir}
      deleteLabel="Excluir sessão"
      cancelLabel="Fechar"
    >
      {sessao ? (
        <>
          <Linha label="Paciente" valor={nomePaciente} />
          <Linha label="Serviço" valor={sessao.service ?? '—'} />
          <Linha
            label="Data e horário"
            valor={`${isoToBr(sessao.date)} · ${sessao.time} até ${addMinutes(sessao.time, sessao.durationMin)} (${sessao.durationMin} min)`}
          />
          <Linha label="Observações" valor={sessao.notes ?? 'Sem observações'} />
        </>
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  linha: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  valor: { fontSize: 15, color: colors.text, marginTop: 4 },
});

// src/componentes/ServicoModal.tsx
// Novo / editar serviço do catálogo (Tela 9): nome, descrição, duração, preço e ativo.
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import FormField from './FormField';
import SheetModal, { sheetStyles } from './SheetModal';
import type { LocalService } from '../database/repositories/types';
import type { ServiceFields } from '../services/apiTypes';
import { centsToInput, parsePriceToCents } from '../services/format';
import { maskInteger, maskMoney } from '../services/masks';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (fields: ServiceFields) => Promise<void>;
  onDelete?: () => Promise<void>;
  service: LocalService | null;
  /** Nomes já usados (para não duplicar). */
  existingNames: string[];
};

export default function ServicoModal({ visible, onClose, onSave, onDelete, service, existingNames }: Props) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [duracao, setDuracao] = useState('');
  const [preco, setPreco] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNome(service?.name ?? '');
    setDescricao(service?.description ?? '');
    setDuracao(service?.durationMin ? String(service.durationMin) : '50');
    setPreco(service?.priceCents != null ? maskMoney(String(service.priceCents)) : '');
    setAtivo(service?.active ?? true);
    setSaving(false);
    setError(null);
  }, [visible, service]);

  const salvar = async () => {
    const n = nome.trim();
    if (!n) return setError('Informe o nome do serviço.');
    const repetido = existingNames.some((x) => x.toLowerCase() === n.toLowerCase() && x !== service?.name);
    if (repetido) return setError('Já existe um serviço com esse nome.');
    const dur = duracao.trim() ? Number(duracao) : null;
    if (dur !== null && (!Number.isInteger(dur) || dur < 5 || dur > 480)) return setError('Duração entre 5 e 480 minutos.');
    const cents = parsePriceToCents(preco);
    if (Number.isNaN(cents)) return setError('Preço inválido. Ex.: 150 ou 99,90');
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: n, description: descricao.trim() || null, durationMin: dur, priceCents: cents, active: ativo });
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || 'Não foi possível salvar o serviço.');
    }
  };

  const excluir = () => {
    if (!onDelete) return;
    Alert.alert(
      'Excluir serviço?',
      'Pacientes e sessões que já usam este serviço mantêm o nome no histórico. Para só esconder dos formulários, desative em vez de excluir.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await onDelete();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <SheetModal
      visible={visible}
      title={service ? 'Editar serviço' : 'Novo serviço'}
      onClose={onClose}
      primaryLabel={service ? 'Salvar serviço' : 'Cadastrar serviço'}
      onPrimary={salvar}
      saving={saving}
      error={error}
      onDelete={service && onDelete ? excluir : undefined}
      deleteLabel="Excluir serviço"
    >
      <FormField id="servico-nome" label="Nome" required placeholder="Ex.: Psicoterapia" value={nome} onChangeText={setNome} maxLength={80} />
      <Text style={sheetStyles.label}>Descrição</Text>
      <TextInput
        style={[sheetStyles.textarea, { minHeight: 70 }]}
        placeholder="Ex.: Sessões semanais de atendimento psicológico."
        placeholderTextColor={colors.placeholder}
        value={descricao}
        onChangeText={setDescricao}
        multiline
        textAlignVertical="top"
        maxLength={200}
        accessibilityLabel="Descrição do serviço"
      />
      <View style={sheetStyles.row}>
        <View style={sheetStyles.col}>
          <FormField id="servico-duracao" label="Duração (min)" placeholder="50" value={duracao} onChangeText={(t) => setDuracao(maskInteger(t))} keyboardType="number-pad" maxLength={3} />
        </View>
        <View style={sheetStyles.col}>
          <FormField id="servico-preco" label="Preço (R$)" placeholder="150,00" value={preco} onChangeText={(t) => setPreco(maskMoney(t))} keyboardType="number-pad" maxLength={10} />
        </View>
      </View>
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Serviço ativo</Text>
          <Text style={styles.switchHint}>Inativos não aparecem para novos pacientes e sessões.</Text>
        </View>
        <Switch
          value={ativo}
          onValueChange={setAtivo}
          trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Serviço ativo"
        />
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  switchHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});

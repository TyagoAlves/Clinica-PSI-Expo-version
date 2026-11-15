// src/telas/AgendaScreen.tsx
// Agenda: sessões de um dia.
//   ‹ Hoje · 13/11/2026 ›  troca o dia
//   + Nova sessão          abre o formulário
//   tocar numa sessão      abre os detalhes (com Editar e Excluir)
import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonShadow, card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppMenu from '../componentes/AppMenu';
import EmptyHero from '../componentes/EmptyHero';
import SessaoModal from '../modais/SessaoModal';
import VerSessaoModal from '../modais/VerSessaoModal';
import { apagarNoBanco, atualizarNoBanco, criarNoBanco, rotas, useDados, usePacientes, type Sessao } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useAppNav } from '../navegacao/AppNav';
import { addDaysIso, addMinutes, dayTitle, todayIso } from '../utils/format';
import type { AppointmentFields } from '../api/tipos';

export default function AgendaScreen() {
  const { clinic } = useAuth();
  const nav = useAppNav();
  const { itens: pacientes, carregado } = usePacientes();
  const [dia, setDia] = useState(todayIso());
  const { itens: sessoes } = useDados<Sessao>(rotas.sessoes(clinic!.id, { de: dia, ate: dia }));
  const [menuOpen, setMenuOpen] = useState(false);
  // Sessão aberta nos detalhes (null = fechado).
  const [vendo, setVendo] = useState<Sessao | null>(null);
  // Formulário: aberto para nova sessão (item null) ou para editar (item = sessão).
  const [form, setForm] = useState<{ open: boolean; item: Sessao | null }>({ open: false, item: null });

  const nomePorId = useMemo(() => new Map(pacientes.map((p) => [p.id, p.name])), [pacientes]);
  const nomeDe = (s: Sessao) => nomePorId.get(s.patientId) ?? 'Paciente removido';

  const salvarSessao = async (campos: AppointmentFields) => {
    if (form.item) await atualizarNoBanco(rotas.sessao(form.item.id), campos);
    else await criarNoBanco(rotas.sessoes(clinic!.id), campos);
    if (campos.date !== dia) setDia(campos.date); // mostra o dia onde a sessão foi parar
  };

  const excluirSessao = async (s: Sessao) => {
    await apagarNoBanco(rotas.sessao(s.id));
  };

  const semPacientes = carregado && pacientes.length === 0;
  const ehHoje = dia === todayIso();

  return (
    <AppScreen>
      <AppToolbar onMenuPress={() => setMenuOpen(true)} />

      <View style={styles.headerRow}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Sessões por dia</Text>
      </View>

      {/* Navegação de data (‹ Hoje · 13/11/2026 ›) */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setDia((d) => addDaysIso(d, -1))} accessibilityRole="button" accessibilityLabel="Dia anterior">
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDia(todayIso())} accessibilityRole="button" accessibilityLabel="Voltar para hoje">
          <Text style={styles.dateText}>{dayTitle(dia)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setDia((d) => addDaysIso(d, 1))} accessibilityRole="button" accessibilityLabel="Próximo dia">
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {semPacientes ? (
        <EmptyHero
          title="Nenhum paciente cadastrado"
          subtitle="Para agendar uma sessão, cadastre um paciente primeiro."
          buttonLabel="Ir para Pacientes"
          onPress={() => nav.reset({ name: 'pacientes' })}
        />
      ) : (
        <>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setForm({ open: true, item: null })}
            accessibilityRole="button"
            accessibilityLabel="Nova sessão"
          >
            <Text style={styles.newBtnText}>+  Nova sessão</Text>
          </TouchableOpacity>

          <View style={styles.listCard}>
            <Text style={styles.listTitle}>
              {ehHoje ? 'Sessões de hoje' : 'Sessões do dia'} · {sessoes.length}
            </Text>
            {sessoes.length === 0 ? (
              <View style={styles.dayEmpty}>
                <Ionicons name="calendar-clear-outline" size={30} color={colors.placeholder} />
                <Text style={styles.dayEmptyText}>Nenhuma sessão agendada neste dia.</Text>
              </View>
            ) : (
              sessoes.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sessao, i === 0 && styles.sessaoFirst]}
                  onPress={() => setVendo(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Sessão às ${s.time} com ${nomeDe(s)}`}
                >
                  <View style={styles.hora}>
                    <Text style={styles.horaIni}>{s.time}</Text>
                    <Text style={styles.horaFim}>até {addMinutes(s.time, s.durationMin)}</Text>
                  </View>
                  <View style={styles.sessaoInfo}>
                    <Text style={styles.sessaoNome} numberOfLines={1}>
                      {nomeDe(s)}
                    </Text>
                    <Text style={styles.sessaoMeta} numberOfLines={1}>
                      {s.service ?? ''}
                      {s.notes ? ` · ${s.notes}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}

      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} active="agenda" />
      <VerSessaoModal
        sessao={vendo}
        nomePaciente={vendo ? nomeDe(vendo) : ''}
        onClose={() => setVendo(null)}
        onEditar={() => {
          setForm({ open: true, item: vendo });
          setVendo(null);
        }}
        onExcluir={() => (vendo ? excluirSessao(vendo) : Promise.resolve())}
      />
      <SessaoModal
        visible={form.open}
        onClose={() => setForm({ open: false, item: null })}
        onSave={salvarSessao}
        onDelete={form.item ? () => excluirSessao(form.item!) : undefined}
        appointment={form.item}
        defaultDate={dia}
        patients={pacientes}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingTop: 14, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface, marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  newBtn: {
    height: 48, borderRadius: 12, backgroundColor: colors.primary, marginTop: 16,
    alignItems: 'center', justifyContent: 'center', ...buttonShadow,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  dateNav: {
    ...card,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 16,
  },
  dateBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '800', color: colors.text },

  dayEmpty: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  dayEmptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 16 },

  listCard: { ...card, marginTop: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, marginBottom: 24 },
  listTitle: { fontSize: 15, fontWeight: '800', color: colors.text, paddingBottom: 12 },
  sessao: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  sessaoFirst: { borderTopColor: colors.border },
  hora: { width: 56 },
  horaIni: { fontSize: 20, fontWeight: '800', color: colors.text },
  horaFim: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  sessaoInfo: { flex: 1, minWidth: 0 },
  sessaoNome: { fontSize: 15, fontWeight: '800', color: colors.text },
  sessaoMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

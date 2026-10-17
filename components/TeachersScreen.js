import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POLL_OPTIONS, useTeachers } from '../context/TeachersContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';
import { TeacherForm } from './TeacherForm';
import { ConfirmModal } from './ConfirmModal';

// Pantalla SIMPLE de docentes: lista + admin CRUD (crear/borrar).
// Editar vive en el detalle. Cada tarjeta tiene BOTON "Ver informacion"
// (fuera de BottomTabs) que lleva a la vista detalle. Header dice "Profesores".
// Monitoreo nube->local: selector OFF/2s/10s/30s (solo-sesión), banner de
// nuevos, badge NUEVO por tarjeta y modal de conflicto nube-vs-local.
export function TeachersScreen() {
  const {
    list, formMode, saving, startCreate, cancelForm, submitForm, removeTeacher,
    isOffline, pendingCount, syncing, syncError, syncNow,
    pollIntervalMs, setPollIntervalMs, pullNow, lastPullAt, pullStatus, pullMessage,
    newIds, newCount, conflicts, resolveConflict,
  } = useTeachers();
  const { colors } = useTheme();
  // Docente pendiente de borrado (solo confirmacion local; el DELETE real
  // lo ejecuta removeTeacher contra el micro en Render, o queda encolado
  // en SQLite si no hay internet para sync posterior).
  const [pendingDelete, setPendingDelete] = useState(null);
  const showOfflineBar = isOffline || pendingCount > 0 || syncing;

  if (formMode === 'create') {
    return (
      <View style={styles.wrap}>
        <TeacherForm initial={null} saving={saving} onSubmit={submitForm} onCancel={cancelForm} />
      </View>
    );
  }

  const doDelete = async () => {
    if (!pendingDelete) return;
    await removeTeacher(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Text style={[styles.count, { color: colors.textMedium }]}>
          {pendingCount > 0 ? `${list.length} locales (${pendingCount} pendientes)` : `${list.length} docentes en la nube`}
        </Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={startCreate}
          accessibilityRole="button"
          accessibilityLabel="Agregar docente"
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addText}>Agregar</Text>
        </Pressable>
      </View>
      {showOfflineBar ? (
        <View style={[styles.offlineBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.dot, { backgroundColor: isOffline ? '#D97706' : colors.primary }]} />
          <Text style={[styles.offlineText, { color: colors.textMedium }]}>
            {syncing ? 'Sincronizando...' : isOffline ? 'Sin conexión — los cambios se sincronizarán solos' : `${pendingCount} pendiente(s) de sincronizar`}
          </Text>
          {!isOffline && pendingCount > 0 && !syncing ? (
            <Pressable onPress={syncNow} accessibilityRole="button" accessibilityLabel="Sincronizar ahora">
              <Text style={[styles.syncLink, { color: colors.primary }]}>Sincronizar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {syncError ? (
        <Text style={styles.syncError}>{syncError}</Text>
      ) : null}
      <View style={[styles.pollBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.pollHeader}>
          <Ionicons name="cloud-download-outline" size={16} color={colors.textMedium} />
          <Text style={[styles.pollTitle, { color: colors.textMedium }]}>Monitoreo nube</Text>
          <Pressable onPress={pullNow} accessibilityRole="button" accessibilityLabel="Revisar nube ahora">
            <Text style={[styles.syncLink, { color: colors.primary }]}>Revisar ahora</Text>
          </Pressable>
        </View>
        <View style={styles.pollRow}>
          {POLL_OPTIONS.map((o) => {
            const active = pollIntervalMs === o.ms;
            return (
              <Pressable
                key={o.label}
                style={[
                  styles.pollBtn,
                  { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' },
                ]}
                onPress={() => setPollIntervalMs(o.ms)}
                accessibilityRole="button"
                accessibilityLabel={`Monitoreo ${o.label}`}
              >
                <Text style={[styles.pollBtnText, { color: active ? '#fff' : colors.textMedium }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {pollIntervalMs ? (
          <Text style={[styles.pollStatus, { color: colors.textMedium }]}>
            {pullStatus === 'checking'
              ? `Revisando la nube cada ${POLL_OPTIONS.find((o) => o.ms === pollIntervalMs)?.label}…`
              : pullStatus === 'waking'
                ? 'Render despertando (~50s en plan gratis): se reintenta en el próximo intervalo.'
                : pullStatus === 'offline'
                  ? 'Sin conexión: monitoreo activo, sin revisar la nube.'
                  : lastPullAt
                    ? `Cada ${POLL_OPTIONS.find((o) => o.ms === pollIntervalMs)?.label} · últ. revisión ${new Date(lastPullAt).toLocaleTimeString()}.`
                    : `Revisando cada ${POLL_OPTIONS.find((o) => o.ms === pollIntervalMs)?.label}.`}
          </Text>
        ) : (
          <Text style={[styles.pollStatus, { color: colors.textMedium }]}>Monitoreo apagado (se resetea al reiniciar).</Text>
        )}
        {pullMessage && pollIntervalMs ? (
          <Text style={[styles.pollStatus, { color: colors.textMedium }]}>{pullMessage}</Text>
        ) : null}
      </View>
      {newCount > 0 ? (
        <View style={styles.newBanner}>
          <Ionicons name="sparkles-outline" size={16} color="#fff" />
          <Text style={styles.newBannerText}>
            {newCount === 1 ? '1 nuevo docente en la nube' : `${newCount} nuevos docentes en la nube`} — ábrelos para quitar la marca
          </Text>
        </View>
      ) : null}
      {list.map((t) => (
        <TeacherCard
          key={t.id}
          teacher={t}
          isNew={newIds.some((v) => String(v) === String(t.id))}
          onDelete={() => setPendingDelete(t)}
          deleting={saving && pendingDelete?.id === t.id}
        />
      ))}
      <ConfirmModal
        visible={!!pendingDelete}
        title="Borrar docente"
        message={pendingDelete ? `¿Borrar a ${pendingDelete.name} (#${pendingDelete.id})? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Borrar"
        confirming={saving}
        onConfirm={doDelete}
        onCancel={() => { if (!saving) setPendingDelete(null); }}
      />
      <ConflictModal conflict={conflicts[0] || null} onResolve={resolveConflict} />
    </View>
  );
}

function ConflictModal({ conflict, onResolve }) {
  const { colors } = useTheme();
  if (!conflict) return null;
  const name = conflict.cloud?.name || conflict.local?.name || `#${conflict.id}`;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onResolve(conflict.id, 'local')} accessibilityLabel="Conflicto de sincronización">
      <View style={styles.overlay}>
        <View style={[styles.conflictCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="git-compare-outline" size={28} color="#D97706" />
          <Text style={[styles.conflictTitle, { color: colors.textDark }]}>Cambio en la nube y pendiente sin subir</Text>
          <Text style={[styles.conflictMsg, { color: colors.textMedium }]}>
            {conflict.cloud
              ? `"${name}" cambió directo en DynamoDB mientras tenías cambios sin subir. ¿Qué versión conservas?`
              : `"${name}" fue borrado en DynamoDB mientras tenías cambios sin subir. ¿Lo restauras desde la nube (se borra local) o mantienes lo tuyo (se resubirá)?`}
          </Text>
          <Pressable
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => onResolve(conflict.id, 'cloud')}
            accessibilityRole="button"
            accessibilityLabel="Usar versión de la nube"
          >
            <Ionicons name="cloud-download-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>{conflict.cloud ? 'Usar nube' : 'Aceptar borrado'}</Text>
          </Pressable>
          <Pressable
            style={[styles.keepBtn, { borderColor: colors.border }]}
            onPress={() => onResolve(conflict.id, 'local')}
            accessibilityRole="button"
            accessibilityLabel="Mantener mis cambios"
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.textDark} />
            <Text style={[styles.keepText, { color: colors.textDark }]}>Mantener lo mío</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function TeacherCard({ teacher, isNew, onDelete, deleting }) {
  const { openDetail } = useTeachers();
  const { colors } = useTheme();
  const isPending = typeof teacher.id === 'string' && String(teacher.id).startsWith('temp-');
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image
        style={styles.photo}
        source={{ uri: teacher.photo }}
        accessibilityLabel={`Foto de ${teacher.name}`}
      />
      <View style={styles.info}>
        <View style={styles.tagRow}>
          <Text style={[styles.name, { color: colors.textDark }]}>{teacher.name}</Text>
        </View>
        <View style={styles.tagRow}>
          {isNew && !isPending ? (
            <View style={styles.newPill}>
              <Text style={styles.newPillText}>NUEVO</Text>
            </View>
          ) : null}
          {isPending ? (
            <Text style={[styles.pendingTag, { color: colors.textMedium }]}>● pendiente de sincronizar</Text>
          ) : null}
        </View>
        <Text style={[styles.prof, { color: colors.textMedium }]} numberOfLines={2}>
          {teacher.profession}
        </Text>
        {/* BOTON fuera del BottomTabs: abre la vista detalle */}
        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => openDetail(teacher)}
          accessibilityRole="button"
          accessibilityLabel={`Ver informacion de ${teacher.name}`}
        >
          <Ionicons name="person-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Ver información</Text>
        </Pressable>
        <Pressable
          style={[styles.deleteBtn, { borderColor: colors.border, opacity: deleting ? 0.7 : 1 }]}
          onPress={onDelete}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel={`Borrar a ${teacher.name}`}
        >
          <Ionicons name="trash-outline" size={16} color="#B91C1C" />
          <Text style={styles.deleteText}>{deleting ? 'Borrando...' : 'Borrar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, width: '100%' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: 13, fontWeight: '700' },
  offlineBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 8, paddingHorizontal: 12, minHeight: 40 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  offlineText: { fontSize: 12, fontWeight: '700', flex: 1 },
  syncLink: { fontSize: 12, fontWeight: '800' },
  syncError: { color: '#B91C1C', fontWeight: '700', fontSize: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 14, minHeight: 44 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  card: {
    flexDirection: 'row', gap: 12, padding: 12,
    borderRadius: RADIUS.l, borderWidth: 1, alignItems: 'center',
  },
  photo: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '800' },
  pendingTag: { fontSize: 11, fontWeight: '700' },
  prof: { fontSize: 13, fontWeight: '600' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 14, marginTop: 6, minHeight: 44,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 8, paddingHorizontal: 14, marginTop: 6, minHeight: 40,
  },
  deleteText: { color: '#B91C1C', fontWeight: '800', fontSize: 13 },
  pollBox: { borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 12, gap: 8 },
  pollHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pollTitle: { fontSize: 12, fontWeight: '800', flex: 1 },
  pollRow: { flexDirection: 'row', gap: 8 },
  pollBtn: { flex: 1, borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 8, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  pollBtnText: { fontSize: 13, fontWeight: '800' },
  pollStatus: { fontSize: 12, fontWeight: '600' },
  newBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D64545', borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 12, minHeight: 44 },
  newBannerText: { color: '#fff', fontSize: 13, fontWeight: '800', flex: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  newPill: { backgroundColor: '#D64545', borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  newPillText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  conflictCard: { borderRadius: RADIUS.l, borderWidth: 1, padding: 20, gap: 10, width: '100%', maxWidth: 420, alignItems: 'center' },
  conflictTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  conflictMsg: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  keepBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, alignSelf: 'stretch',
  },
  keepText: { fontWeight: '800', fontSize: 14 },
});

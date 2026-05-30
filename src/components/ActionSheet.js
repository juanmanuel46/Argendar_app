import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius, spacing } from '../lib/theme'

export default function ActionSheet({ visible, title, message, options = [], onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />

          {(title || message) && (
            <View style={s.header}>
              {title   && <Text style={s.title}>{title}</Text>}
              {message && <Text style={s.message}>{message}</Text>}
            </View>
          )}

          <View style={s.optionsCard}>
            {options.map((opt, i) => (
              <View key={i}>
                {i > 0 && <View style={s.divider} />}
                <TouchableOpacity
                  style={s.optionRow}
                  onPress={() => { onClose(); opt.onPress?.() }}
                  activeOpacity={0.7}
                >
                  {opt.icon && (
                    <View style={[s.iconWrap, opt.variant === 'danger' && s.iconWrapDanger]}>
                      <Feather
                        name={opt.icon}
                        size={16}
                        color={opt.variant === 'danger' ? colors.danger : colors.primary}
                      />
                    </View>
                  )}
                  <Text style={[s.optionLabel, opt.variant === 'danger' && s.optionLabelDanger]}>
                    {opt.label}
                  </Text>
                  <Feather name="chevron-right" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

export function useActionSheet() {
  const [sheet, setSheet] = require('react').useState({ visible: false, title: '', message: '', options: [] })
  const show = (config) => setSheet({ ...config, visible: true })
  const hide = () => setSheet(prev => ({ ...prev, visible: false }))
  return { sheet, showSheet: show, hideSheet: hide }
}

const s = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor:     colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius:24,
    paddingHorizontal:   spacing.lg,
    paddingTop:          12,
    paddingBottom:       40,
    borderTopWidth:      1,
    borderColor:         colors.border,
    gap:                 spacing.md,
  },
  handle: {
    width:           36,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.border,
    alignSelf:       'center',
    marginBottom:    4,
  },
  header: {
    alignItems: 'center',
    gap:        6,
    paddingVertical: 4,
  },
  title: {
    fontSize:   16,
    fontWeight: '700',
    color:      colors.textPrimary,
  },
  message: {
    fontSize:   13,
    color:      colors.textSecondary,
    textAlign:  'center',
    lineHeight: 18,
  },
  optionsCard: {
    backgroundColor: colors.input,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        'hidden',
  },
  divider: {
    height:          1,
    backgroundColor: colors.border,
    marginHorizontal:14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       16,
    gap:           12,
  },
  iconWrap: {
    width:           34,
    height:          34,
    borderRadius:    radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent:  'center',
    alignItems:      'center',
  },
  iconWrapDanger: {
    backgroundColor: colors.dangerBg,
  },
  optionLabel: {
    flex:       1,
    fontSize:   15,
    color:      colors.textPrimary,
    fontWeight: '500',
  },
  optionLabelDanger: {
    color: colors.danger,
  },
  cancelBtn: {
    backgroundColor: colors.input,
    borderRadius:    radius.lg,
    padding:         16,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  cancelText: {
    fontSize:   15,
    color:      colors.textSecondary,
    fontWeight: '600',
  },
})

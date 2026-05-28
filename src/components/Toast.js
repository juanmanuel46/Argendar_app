import { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius } from '../lib/theme'

const ICONS = {
  success: 'check-circle',
  error:   'x-circle',
  warning: 'alert-triangle',
  info:    'info',
}

const ICON_COLORS = {
  success: colors.success,
  error:   colors.danger,
  warning: colors.warning,
  info:    colors.primary,
}

export function Toast({ visible, message, type = 'success', onHide }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide?.())
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View style={[s.container, { opacity, transform: [{ translateY }] }]}>
      <View style={s.iconWrap}>
        <Feather name={ICONS[type]} size={16} color={ICON_COLORS[type]} />
      </View>
      <Text style={s.message}>{message}</Text>
    </Animated.View>
  )
}

// Hook para usarlo fácil
import { useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })

  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type })
  }

  function hideToast() {
    setToast(prev => ({ ...prev, visible: false }))
  }

  return { toast, showToast, hideToast }
}

const s = StyleSheet.create({
  container: {
    position:        'absolute',
    top:             60,
    left:            20,
    right:           20,
    zIndex:          9999,
    backgroundColor: '#1A1530',
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     '#2D2450',
    flexDirection:   'row',
    alignItems:      'center',
    padding:         14,
    gap:             12,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.4,
    shadowRadius:    16,
    elevation:       10,
  },
  iconWrap: {
    width:           32,
    height:          32,
    borderRadius:    radius.md,
    backgroundColor: 'rgba(139,92,246,0.12)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  message: {
    flex:      1,
    fontSize:  14,
    color:     colors.textPrimary,
    fontWeight:'500',
    lineHeight:20,
  },
})
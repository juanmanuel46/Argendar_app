// Mapeo de categorías de negocio a iconos del set Feather
// Cuando agreguemos una nueva categoría en CreateBusinessScreen, agregarla acá también

export const CATEGORY_ICONS = {
  'Barbería':    'scissors',
  'Peluquería':  'scissors',
  'Spa':         'droplet',
  'Médico':      'thermometer',
  'Dentista':    'plus-square',
  'Veterinaria': 'heart',
  'Gimnasio':    'activity',
  'Estética':    'star',
  'Masajes':     'wind',
  'Lavadero':    'truck',
  'Canchas':     'target',
  'Otro':        'briefcase',
}

// Función helper: dada una categoría, devuelve el ícono correspondiente
// Si la categoría no existe en el mapeo, devuelve un ícono genérico
export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || 'briefcase'
}
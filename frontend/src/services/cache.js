// Servicio de cache para optimizar consultas frecuentes
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
  }

  // Generar clave única para el cache
  generateKey(service, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${service}:${sortedParams}`;
  }

  // Obtener datos del cache
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Verificar si el cache ha expirado
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Guardar datos en el cache
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Invalidar cache específico
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Limpiar todo el cache
  clear() {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        expiredEntries++;
        this.cache.delete(key);
      } else {
        validEntries++;
      }
    }

    return {
      total: validEntries + expiredEntries,
      valid: validEntries,
      expired: expiredEntries,
      size: this.cache.size
    };
  }
}

// Instancia global del cache
const cacheService = new CacheService();

// Función helper para cachear llamadas a API
export const cachedApiCall = async (apiFunction, params, ttl = 5 * 60 * 1000) => {
  const key = cacheService.generateKey(apiFunction.name, params);
  
  // Intentar obtener del cache
  const cached = cacheService.get(key);
  if (cached) {
    return cached;
  }

  // Si no está en cache, hacer la llamada a la API
  const data = await apiFunction(...Object.values(params));
  
  // Guardar en cache
  cacheService.set(key, data, ttl);
  
  return data;
};

// Función para invalidar cache de grupos
export const invalidateGroupCache = (groupId) => {
  cacheService.invalidate(`getGroupDetails:${groupId}`);
  cacheService.invalidate(`getGroupExpenses:${groupId}`);
};

// Función para invalidar cache de gastos
export const invalidateExpensesCache = (groupId) => {
  cacheService.invalidate(`getGroupExpenses:${groupId}`);
};

export default cacheService; 
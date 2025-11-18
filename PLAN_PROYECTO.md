# Plan de Desarrollo: CryptoView Mobile

## 📋 Resumen del Proyecto

**Objetivo:** Desarrollar una aplicación móvil nativa con React Native y Expo que permita consultar precios de criptomonedas en tiempo real con soporte para múltiples monedas fiduciarias (MXN, USD, EUR).

**Tecnologías:**
- React Native con Expo
- Expo Router (navegación basada en archivos)
- TypeScript/JavaScript (ES6+)
- API: CoinGecko (pública, sin API key)
- Estilos: StyleSheet.create

---

## 🎯 Funcionalidades Requeridas

1. ✅ **Listado en Tiempo Real**: Top 20-50 criptomonedas en lista scrollable
2. ✅ **Selector de Divisa**: Cambiar entre USD, MXN, EUR
3. ✅ **Buscador**: Filtrar por nombre o símbolo
4. ✅ **Pull-to-Refresh**: Actualización manual deslizando hacia abajo

---

## 📐 Fases de Desarrollo

### **FASE 1: Estructura y UI Estática** 🎨

**Objetivo:** Crear la interfaz visual básica con datos mock

**Tareas:**
- [ ] Modificar `app/(tabs)/index.tsx` para mostrar la lista de criptomonedas
- [ ] Implementar `SafeAreaView` para manejar áreas seguras (iOS/Android)
- [ ] Crear componente de tarjeta para cada criptomoneda con:
  - Nombre de la criptomoneda
  - Símbolo (ej: BTC)
  - Precio estático (mock)
  - Cambio porcentual (mock)
- [ ] Usar `FlatList` (NO `map`) para renderizar la lista
- [ ] Crear datos mock con 5-10 criptomonedas de ejemplo
- [ ] Aplicar estilos modernos con `StyleSheet.create`
- [ ] Usar `@expo/vector-icons` para iconos (si aplica)

**Archivos a modificar:**
- `app/(tabs)/index.tsx` (pantalla principal)

**Criterios de éxito:**
- La app muestra una lista visualmente atractiva de criptomonedas
- Los estilos son responsivos y se ven bien en diferentes tamaños de pantalla
- No hay errores de sintaxis

---

### **FASE 2: Conexión a API (CoinGecko) y Hooks** 🔌

**Objetivo:** Reemplazar datos mock con datos reales de la API

**Tareas:**
- [ ] Crear función asíncrona `fetchCoins` que consuma CoinGecko API
  - Endpoint: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=50`
  - Parámetros: `vs_currency`, `per_page=50`, `order=market_cap_desc`
- [ ] Implementar estado con `useState` para:
  - Lista de criptomonedas
  - Estado de carga (`loading`)
  - Manejo de errores (`error`)
- [ ] Usar `useEffect` para cargar datos al montar el componente
- [ ] Mostrar `ActivityIndicator` durante la carga
- [ ] Manejar errores de red con mensaje al usuario
- [ ] Formatear precios con 2 decimales

**Archivos a modificar:**
- `app/(tabs)/index.tsx`

**Criterios de éxito:**
- Los datos se cargan automáticamente al abrir la app
- Se muestra indicador de carga mientras se obtienen los datos
- Los precios se muestran correctamente formateados
- Manejo adecuado de errores de red

---

### **FASE 3: Interactividad (Cambio de Divisa y Buscador)** 🔄

**Objetivo:** Agregar funcionalidad de cambio de moneda y búsqueda

**Tareas:**

#### 3.1 Selector de Divisa
- [ ] Crear estado `currency` con valores: `'usd'`, `'mxn'`, `'eur'`
- [ ] Crear componente de botones/tabs para seleccionar moneda
- [ ] Al cambiar moneda, actualizar la llamada a la API con el nuevo `vs_currency`
- [ ] Mostrar símbolo de moneda correspondiente ($, €, $MXN)
- [ ] Actualizar formato de precios según la moneda seleccionada

#### 3.2 Buscador
- [ ] Agregar `TextInput` en la parte superior de la pantalla
- [ ] Crear estado `searchQuery` para el texto de búsqueda
- [ ] Implementar filtro local usando `.filter()` que busque en:
  - Nombre de la criptomoneda (ej: "Bitcoin")
  - Símbolo (ej: "BTC")
- [ ] La búsqueda debe ser case-insensitive
- [ ] Actualizar `FlatList` para mostrar solo resultados filtrados

**Archivos a modificar:**
- `app/(tabs)/index.tsx`

**Criterios de éxito:**
- Los botones de moneda cambian correctamente los precios
- La búsqueda filtra la lista en tiempo real
- La búsqueda funciona tanto por nombre como por símbolo
- La interfaz es intuitiva y fácil de usar

---

### **FASE 4: Refinamiento y UX (Pull-to-Refresh)** ✨

**Objetivo:** Mejorar la experiencia de usuario y funcionalidad final

**Tareas:**
- [ ] Implementar Pull-to-Refresh en `FlatList`:
  - Usar prop `refreshing` (estado booleano)
  - Usar prop `onRefresh` (función que recarga datos)
- [ ] Mejorar formato de precios:
  - Usar `Intl.NumberFormat` o función personalizada
  - Mostrar comas para miles (ej: 1,234.56)
  - Mantener 2 decimales
  - Mostrar símbolo de moneda correcto
- [ ] Formatear cambio porcentual:
  - Mostrar en verde si es positivo
  - Mostrar en rojo si es negativo
  - Incluir símbolo + o - según corresponda
- [ ] Ajustar estilos para Android e iOS:
  - Verificar que `SafeAreaView` funcione correctamente
  - Asegurar que la barra de estado no oculte contenido
  - Probar en diferentes tamaños de pantalla
- [ ] Optimizar rendimiento:
  - Usar `keyExtractor` en FlatList
  - Considerar `getItemLayout` si es necesario
  - Verificar que no haya re-renders innecesarios

**Archivos a modificar:**
- `app/(tabs)/index.tsx`

**Criterios de éxito:**
- Pull-to-refresh funciona correctamente
- Los precios tienen formato profesional de moneda
- Los colores indican correctamente ganancias/pérdidas
- La app se ve bien en Android e iOS
- No hay problemas de rendimiento

---

## ✅ Checklist Final (Rúbrica de Evaluación)

Antes de entregar, verificar:

- [ ] El código no tiene errores de sintaxis y corre en Expo Go
- [ ] Se usa `FlatList` y NO `map` para la lista principal (Rendimiento)
- [ ] Los iconos se implementan usando `@expo/vector-icons`
- [ ] No hay API keys expuestas (aunque CoinGecko es pública)
- [ ] La interfaz responde bien a diferentes tamaños de pantalla (Flexbox)
- [ ] Los precios tienen formato correcto (comas, decimales, símbolos)
- [ ] Pull-to-refresh funciona correctamente
- [ ] El buscador filtra correctamente por nombre y símbolo
- [ ] El selector de moneda funciona para USD, MXN y EUR
- [ ] Se manejan estados de carga y error apropiadamente

---

## 📁 Estructura de Archivos Propuesta

```
cryptoapp/
├── app/
│   └── (tabs)/
│       └── index.tsx          # Pantalla principal (modificar)
├── components/                 # (Opcional: si se crean componentes reutilizables)
│   └── CryptoCard.tsx         # Tarjeta de criptomoneda (opcional)
├── utils/                      # (Opcional: funciones auxiliares)
│   └── formatters.ts          # Funciones de formateo de moneda (opcional)
└── instrucciones.md            # Especificaciones del proyecto
```

---

## 🔧 Consideraciones Técnicas

1. **API CoinGecko:**
   - Endpoint base: `https://api.coingecko.com/api/v3/coins/markets`
   - Parámetros: `vs_currency`, `per_page`, `order`
   - No requiere API key (pública)
   - Rate limit: ~10-50 llamadas/minuto (suficiente para este proyecto)

2. **Manejo de Estado:**
   - Usar `useState` para datos locales
   - Usar `useEffect` para efectos secundarios (carga de datos)
   - Considerar `useCallback` para funciones que se pasan como props

3. **Rendimiento:**
   - `FlatList` es más eficiente que `map` para listas largas
   - Usar `keyExtractor` para optimizar re-renders
   - Considerar `React.memo` si se crean componentes separados

4. **Formateo de Moneda:**
   ```javascript
   // Ejemplo de formateo
   const formatPrice = (price, currency) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: currency.toUpperCase(),
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     }).format(price);
   };
   ```

---

## 🚀 Orden de Implementación Recomendado

1. **Fase 1** → Establecer base visual
2. **Fase 2** → Conectar con datos reales
3. **Fase 3** → Agregar interactividad
4. **Fase 4** → Pulir detalles y UX

**Nota:** Cada fase debe estar funcional antes de pasar a la siguiente.

---

## 📝 Notas Adicionales

- El proyecto usa **Expo Router**, por lo que la pantalla principal está en `app/(tabs)/index.tsx` (no `App.js`)
- Ya se tiene instalado `@expo/vector-icons` en las dependencias
- El proyecto está configurado con TypeScript, pero se puede usar JavaScript
- Se recomienda probar en Expo Go tanto en dispositivo físico como en simulador

---

**Fecha de creación del plan:** $(date)
**Estado:** Listo para implementación


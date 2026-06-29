# Gastos Mensuales

PWA para controlar gastos con ciclo de nómina, entrada rápida, edición de movimientos, importación CSV y estética tipo app bancaria moderna.

## Qué hace

- Entrada rápida de gastos e ingresos.
- Resumen por ciclo mensual, por defecto del 27 al 26.
- Presupuesto mensual, ahorro objetivo, gastado, ingresos y disponible.
- Edición y borrado de movimientos.
- Historial con búsqueda y filtro por categoría.
- Barras de gasto por categoría.
- Atajos para gastos repetidos.
- Importación CSV con detección de fecha, concepto, importe, cargo y abono.
- Detección y omisión de duplicados obvios.
- Marcado de movimientos dudosos como “revisar”.
- Modo claro/oscuro real y paletas configurables.
- Iconos PWA en SVG, 192, 512 y Apple Touch Icon.
- Exportación JSON y CSV.
- Datos guardados en `localStorage`.

## Ejecutar

```bash
npm install
npm run start
```

También se puede abrir `index.html` directamente, aunque para PWA/service worker es mejor servirlo por HTTP.

## Sobre banco y Wallet

La app empieza con entrada rápida e importación CSV. La integración bancaria real requiere backend y autorización bancaria mediante PSD2/Open Banking.

Apple Wallet no expone a una app web normal el historial de pagos de tus tarjetas. Para detectar movimientos automáticamente, la vía realista es el banco.

## v14

- Rediseño visual completo con CSS unificado en `styles.css`.
- Eliminados los parches visuales de `fixes.css` y `fixes.js`.
- Modo claro y oscuro con contraste real.
- Barra de navegación adaptada: inferior en móvil y lateral en escritorio.
- Corregida la importación CSV con columnas separadas de `Cargo` y `Abono`.
- Mejorada la importación de CSV con importación por lotes, no render por cada movimiento.
- Añadida edición de movimientos.
- Fechas locales, sin `toISOString()` para evitar saltos raros por UTC.
- Manifest y service worker actualizados a v14.
- Añadidos iconos PNG para PWA/iPhone.

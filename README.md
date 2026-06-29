# Gastos Mensuales

PWA sencilla para controlar gastos sin depender de una app bancaria desde el minuto uno.

## Que hace

- Entrada rapida de gastos e ingresos.
- Resumen mensual con ingresos, gastos, disponible y presupuesto.
- Ciclo mensual configurable por dia de cobro, por defecto del 27 al 26.
- Apariencia configurable con modo claro/oscuro y paletas que actualizan también el color de ventana en iOS.
- Home visual tipo app bancaria moderna, con degradado a pantalla completa, acciones rápidas y barra inferior pulida.
- Categorias y barras por categoria.
- Importacion CSV desde el banco con deteccion basica de fecha, concepto e importe.
- Reglas automaticas para clasificar comercios comunes.
- Exportacion JSON y CSV.
- Funciona en local con `localStorage` y se puede instalar como PWA.

## Ejecutar

```bash
npm install
npm run start
```

Tambien se puede abrir `index.html` directamente, aunque para PWA/service worker es mejor servirlo por HTTP.

## Sobre banco y Wallet

La app esta pensada para empezar con entrada rapida e importacion CSV. La integracion bancaria real iria en una segunda fase con backend y un proveedor PSD2/Open Banking.

Apple Wallet no expone a una app normal el historial de pagos de tus tarjetas. La via realista para detectar movimientos es el banco, no Wallet.

## Notas de uso en iPhone

Para que el degradado ocupe toda la pantalla como app real, abre la web y añádela a inicio. En Safari normal la barra del navegador puede seguir apareciendo porque iOS decide hacer de iOS.

## Siguiente fase recomendada

1. Backend pequeño para guardar datos y usuarios.
2. Integracion con proveedor Open Banking europeo.
3. Reglas de conciliacion para evitar duplicados.
4. Avisos para revisar movimientos importados.

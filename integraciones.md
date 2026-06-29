# Integraciones bancarias

## Wallet / Apple Pay

No es buena base para esta app. PassKit permite usar Apple Pay en una app y gestionar pases de Wallet, pero no da acceso general al historial de compras de las tarjetas del usuario.

## Banco por PSD2 / Open Banking

Es la via correcta si se quiere sincronizar movimientos:

- El usuario da consentimiento en su banco.
- Un proveedor como Tink, Enable Banking o similar devuelve cuentas y transacciones.
- La app necesita un backend para guardar tokens, consentimientos y sincronizaciones.
- Muchas transacciones de tarjeta no aparecen al instante; pueden llegar cuando el banco las asienta.
- Hay que gestionar renovacion/reautenticacion de consentimientos y duplicados.

## Camino recomendado

Para una primera version personal:

1. PWA local con entrada rapida.
2. Importacion CSV del banco.
3. Reglas automaticas por comercio.
4. Cuando la app ya sea util, meter backend e integracion bancaria.

Esto evita gastar semanas en permisos bancarios antes de saber si el flujo diario funciona.

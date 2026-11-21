# Sistema de agroservicio

Aplicación web para un agroservicio (venta de insumos agrícolas, fertilizantes y herramientas). Tiene un **catálogo público** donde los clientes buscan productos y solicitan cotizaciones, y un **panel de empleados** donde se gestiona el inventario y se atienden los pedidos en tiempo real.

## Propósito

Digitalizar la atención de un agroservicio:

* Que los clientes consulten el catálogo, comparen presentaciones y soliciten una cotización sin tener que llamar o visitar el local.
* Que los empleados controlen el inventario, reciban alertas cuando el stock baja y den seguimiento a cada cotización desde un solo lugar.

Las cotizaciones son **solicitudes, no compras**: el cliente arma un carrito y el personal confirma precios, existencias y entrega.

## Funciones principales

### Catálogo público (`/`)

* Buscador por producto, marca, ingrediente activo, descripción o categoría (ignora tildes y mayúsculas).
* Filtros por categoría, por ingrediente activo y por "solo con existencias".
* Detalle de producto con selección de **presentación** (por ejemplo, saco de 46 kg o bolsa de 5 kg), cada una con su precio y su stock.
* Carrito persistente (se conserva al recargar la página) con cantidades limitadas al stock disponible.
* Formulario de cotización que guarda el pedido en la base de datos y entrega al cliente un código de referencia, con enlace a WhatsApp.
* Catálogo actualizado en tiempo real.

### Panel de empleados (`/admin`)

* Acceso con correo y contraseña (Firebase Authentication). Las rutas del panel están protegidas.
* **Inventario:** alta, edición y eliminación de productos, con presentaciones dinámicas, y opción de ocultar un producto del catálogo sin borrarlo.
* Ajuste rápido de existencias con botones +/− o escribiendo la cantidad, mediante transacciones para evitar conflictos entre empleados.
* **Alertas de stock bajo o agotado**, con filtro para ver solo esos productos.
* **Pedidos en tiempo real:** aviso en pantalla cuando llega una cotización nueva, cambio de estado (nuevo, en revisión, cotizado, completado, cancelado), nota interna y enlaces de contacto al cliente por teléfono, correo y WhatsApp.
* Carga de productos de ejemplo con un clic cuando el inventario está vacío.

## Tecnologías usadas

|Tecnología|Uso|
|-|-|
|[Angular](https://angular.dev)|Aplicación de una sola página: componentes standalone, señales (signals), rutas con carga diferida y guard de autenticación|
|TypeScript|Lenguaje del proyecto|
|[Firebase](https://firebase.google.com) (SDK modular, paquete `firebase`)|Backend sin servidor|
|Cloud Firestore|Base de datos en tiempo real (colecciones `productos` y `pedidos`)|
|Firebase Authentication|Inicio de sesión de empleados (correo y contraseña)|
|HTML y CSS|Plantillas y estilos propios, sin librerías de componentes|
|Google Fonts|Bricolage Grotesque y Public Sans|

Desarrollado con Angular CLI 22.1.4, Node.js 24.19.0 y npm 11.17.0.

El proyecto usa el paquete `firebase` directamente, no AngularFire. Todo el acceso a Firebase está concentrado en `src/app/firebase.service.ts`.

## Requisitos

* **Node.js** y **npm** (se usó Node.js 24.19.0 y npm 11.17.0).
* **Angular CLI**: `npm install -g @angular/cli`
* **Git** (para clonar el repositorio).
* Una cuenta de **Google** para crear el proyecto en Firebase. El plan gratuito (Spark) es suficiente.
* Un navegador moderno.

## Instalación

1. Clone el repositorio e instale las dependencias:

```bash
   git clone https://github.com/ObedLett/agroservicio.git
   cd agroservicio
   npm install
   ```

2. Si parte de un proyecto nuevo en lugar de clonar este repositorio:

```bash
   ng new agroservicio
   cd agroservicio
   npm install firebase
   ```

   Después copie la carpeta `src` de este proyecto encima de la `src` generada, y borre los archivos de plantilla que ya no se usan en `src/app` (`app.html`, `app.css`, `app.spec.ts`).

## Configuración de Firebase

### 1\. Crear el proyecto y la app web

1. Entre a la [consola de Firebase](https://console.firebase.google.com) y cree un proyecto.
2. En la página principal del proyecto pulse **Agregar app** y elija **Web** (`</>`). Póngale un apodo; no es necesario activar Hosting.
3. Copie el objeto `firebaseConfig` que le muestra.

### 2\. Pegar la configuración en el código

Abra `src/app/firebase.config.ts` y reemplace los valores:

```ts
export const firebaseConfig = {
  apiKey: 'SU\_API\_KEY',
  authDomain: 'SU\_PROYECTO.firebaseapp.com',
  projectId: 'SU\_PROYECTO',
  storageBucket: 'SU\_PROYECTO.firebasestorage.app',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000'
};

export const NEGOCIO = {
  nombre: 'Agroservicio El Surco',
  telefono: '2200-0000',
  whatsapp: '50370000000', // solo dígitos, con código de país
  moneda: 'USD',
  locale: 'es-SV'
};
```

`NEGOCIO` define el nombre, el teléfono, el WhatsApp, la moneda y el formato de números que se muestran en la aplicación.

### 3\. Crear la base de datos

1. En **Firestore Database** pulse **Crear base de datos**.
2. Elija una ubicación (no se puede cambiar después) e inicie en **modo de producción**.
3. No hace falta crear las colecciones: Firestore las crea al guardar el primer documento.

### 4\. Reglas de seguridad

En la pestaña **Reglas** de Firestore pegue lo siguiente y pulse **Publicar**:

```
rules\_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function esEmpleado() { return request.auth != null; }

    match /productos/{id} {
      allow read: if resource.data.activo == true || esEmpleado();
      allow write: if esEmpleado();
    }
    match /pedidos/{id} {
      allow create: if request.resource.data.estado == 'nuevo'
        \&\& request.resource.data.cliente.nombre is string
        \&\& request.resource.data.items is list
        \&\& request.resource.data.items.size() > 0
        \&\& request.resource.data.items.size() <= 50;
      allow read, update, delete: if esEmpleado();
    }
  }
}
```

Estas reglas permiten que cualquier visitante vea los productos activos y envíe cotizaciones, y que solo los usuarios con sesión iniciada gestionen el inventario y vean los pedidos.

### 5\. Activar el acceso de empleados

1. En **Authentication → Método de acceso**, active **Correo electrónico/contraseña**.
2. En la pestaña **Usuarios**, agregue una cuenta por cada empleado.
3. Se recomienda desactivar el registro libre de usuarios en la configuración de Authentication.

Con estas reglas, **cualquier usuario autenticado tiene permisos de empleado**, por lo que solo debe crear cuentas para personas de confianza.

## Ejecución

```bash
ng serve
```

Abra `http://localhost:4200`:

|Ruta|Descripción|
|-|-|
|`/`|Catálogo público|
|`/admin/login`|Acceso de empleados|
|`/admin`|Panel de empleados (requiere sesión)|

Para detener el servidor pulse `Ctrl + C` en la terminal.

### Primer uso

1. Entre a `/admin/login` con el usuario creado en Firebase Authentication.
2. Si el inventario está vacío, pulse **Cargar productos de ejemplo**.
3. Abra `/`, agregue productos al carrito y envíe una cotización de prueba.
4. Compruebe que el pedido aparece en la pestaña **Pedidos** del panel, con su aviso, sin recargar.

### Compilar para producción

```bash
ng build
```

Los archivos resultantes quedan en la carpeta `dist/`.

## Estructura del proyecto

```
src/
├── index.html
├── styles.css                    Paleta, tipografía y estilos compartidos
└── app/
    ├── firebase.config.ts        Configuración de Firebase y datos del negocio
    ├── firebase.service.ts       Acceso a Firestore y Authentication
    ├── carrito.service.ts        Estado del carrito (señales y localStorage)
    ├── aviso.service.ts          Avisos emergentes
    ├── auth.guard.ts             Protege la ruta /admin
    ├── models.ts                 Interfaces, categorías, estados y utilidades
    ├── dinero.pipe.ts            Formato de moneda
    ├── ejemplos.ts               Productos de ejemplo
    ├── app.routes.ts             Rutas
    ├── catalogo/                 Catálogo, detalle de producto y carrito
    └── admin/
        ├── login/                Acceso de empleados
        └── panel/                Panel, inventario, editor de producto y pedidos
```

## Modelo de datos

### Colección `productos`

|Campo|Tipo|Descripción|
|-|-|-|
|`nombre`|string|Nombre del producto|
|`categoria`|string|`fertilizantes`, `herbicidas`, `insecticidas`, `fungicidas`, `semillas` o `herramientas`|
|`marca`|string|Marca (opcional)|
|`ingredienteActivo`|string|Vacío en herramientas|
|`descripcion`|string|Descripción (opcional)|
|`imagenUrl`|string|URL de imagen (opcional)|
|`activo`|boolean|`false` lo oculta del catálogo público|
|`presentaciones`|array|Cada elemento tiene `id`, `etiqueta`, `sku`, `precio`, `stock` y `stockMinimo`|
|`creadoEn`, `actualizadoEn`|timestamp|Fechas de creación y actualización|

Una presentación se considera en **stock bajo** cuando `stock <= stockMinimo`, y **agotada** cuando `stock = 0`.

### Colección `pedidos`

|Campo|Tipo|Descripción|
|-|-|-|
|`cliente`|map|`nombre`, `telefono`, `email`, `municipio`|
|`items`|array|Copia de lo cotizado: `productoId`, `nombre`, `presentacionId`, `presentacion`, `cantidad`, `precioUnitario`, `subtotal`|
|`total`|number|Suma de los subtotales|
|`notas`|string|Comentarios del cliente|
|`estado`|string|`nuevo`, `en\_revision`, `cotizado`, `completado` o `cancelado`|
|`notaInterna`|string|Solo visible para empleados|
|`creadoEn`, `actualizadoEn`|timestamp|Fechas de creación y actualización|

No se necesitan índices compuestos en Firestore.

## Notas

* Los datos de `firebaseConfig` no son secretos: la seguridad del sistema la dan las reglas de Firestore.
* Un pedido no descuenta el inventario automáticamente; el empleado ajusta las existencias al confirmar la venta.
* Los precios y existencias mostrados en el catálogo son referenciales hasta que el personal confirme la cotización.

## Autor

Oved y Natalia, desarrollo de aplicaciones web con OpenSource y 2026.


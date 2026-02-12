# 🏥 Sistema de Gestión de Citas para Clínica de Fisioterapia

Una aplicación web completa para administrar una clínica de fisioterapia, construida con Node.js, Express, PostgreSQL y plantillas EJS. Este proyecto sigue la arquitectura Modelo-Vista-Controlador (MVC).

## ✨ Características Principales

### 👥 Control de Acceso Basado en Roles
- **Admin**: Acceso total al sistema - gestiona terapeutas, pacientes, citas y disponibilidad.
- **Doctor**: Crea citas y visualiza las citas recientes.
- **Secretaria**: Ve y edita todas las agendas, exporta a CSV.
- **Terapeuta**: Ve su agenda personal con interfaz adaptable a móviles.

### 📅 Gestión Inteligente de Citas
- **Programación Automática**: Búsqueda inteligente de espacios basada en la disponibilidad del terapeuta.
- **Creación de Series**: Reserva 5 o 10 sesiones consecutivas automáticamente.
- **Gestión de Pacientes**: Búsqueda y verificación de pacientes basada en cédula.
- **Resaltado en Tiempo Real**: Las citas recién creadas se resaltan con una animación.
- **Gestión de Disponibilidad**: Configura los horarios de los terapeutas por día y hora.

### 🎨 UI/UX Moderna
- Diseño limpio basado en tarjetas centrado en el usuario.
- Esquema de colores azul cielo (#0ea5e9).
- Diseño responsivo para móvil, tableta y escritorio.
- Animaciones y transiciones suaves.
- Interfaz en idioma español.

### 🔒 Características de Seguridad
- Hashing de contraseñas con Bcrypt.
- Gestión de sesiones del lado del servidor (duración de 24 horas).
- Límite de tasa en el inicio de sesión (5 intentos cada 15 minutos).
- Protección de rutas basada en roles.

## 🚀 Comenzando

### Requisitos Previos
- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/cristoza/Haiam_pro.git
   cd physio-clinic-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en el directorio raíz copiando `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Actualiza los valores en `.env`:
   ```env
   # Configuración de Base de Datos
   DB_NAME=Fisiatria_BD
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña
   DB_HOST=localhost
   DB_PORT=5432

   # Configuración del Servidor
   PORT=3000
   NODE_ENV=development

   # Secreto de Sesión (¡cambiar en producción!)
   SESSION_SECRET=tu-clave-secreta-cambiar-en-produccion
   ```

4. **Configurar la base de datos**
   ```bash
   # Las secuencias de comandos crean la DB si no existe
   
   # Ejecutar scripts de configuración
   node scripts/create-db.js
   node scripts/seed-db.js
   node scripts/seed-users.js
   ```

5. **Iniciar la aplicación**
   ```bash
   npm start
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 👤 Cuentas de Usuario Predeterminadas

| Rol | Usuario | Contraseña |
|------|----------|----------|
| Admin | admin | admin123 |
| Doctor | doctor | doctor123 |
| Secretaria | secretary | secretary123 |
| Terapeuta | ana.morales | therapist123 |

⚠️ **¡Cambia las contraseñas en producción!**

## 📁 Estructura del Proyecto

```
physio-clinic-app/
├── src/
│   ├── app.js                 # Aplicación principal
│   ├── config/db.js          # Configuración de base de datos
│   ├── controllers/          # Controladores de peticiones
│   ├── middlewares/          # Auth, validación, rate limiting
│   ├── models/              # Modelos Sequelize
│   ├── routes/              # Rutas Express
│   ├── services/            # Lógica de negocio
│   ├── views/               # Plantillas EJS
│   ├── public/              # Archivos estáticos (CSS, JS)
│   └── utils/               # Funciones de utilidad
├── scripts/                 # Scripts de configuración de BD
├── tests/                   # Tests unitarios
└── client/                  # Frontend en React (Nuevo)
```

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js
- **Base de Datos**: PostgreSQL con Sequelize ORM
- **Plantillas**: EJS (Legacy), React (Nuevo)
- **Auth**: bcrypt, express-session
- **Seguridad**: Helmet.js, express-rate-limit
- **Estilos**: CSS Personalizado

## 📱 Diseño Responsivo

- **Escritorio** (>1024px): Funcionalidades completas
- **Tableta** (768px-1024px): Optimizado para táctil
- **Móvil** (<768px): Diseño basado en tarjetas

## 🔧 Endpoints de API

### Autenticación
- `POST /login` - Iniciar sesión
- `POST /logout` - Cerrar sesión

### Citas
- `GET /api/appointments` - Listar
- `POST /api/appointments` - Crear una
- `POST /api/appointments/series` - Crear serie (5/10 sesiones)
- `PUT /api/appointments/:id` - Actualizar
- `DELETE /api/appointments/:id` - Eliminar

### Pacientes
- `GET /patients` - Listar
- `GET /patients/cedula/:cedula` - Buscar por cédula
- `POST /patients` - Crear
- `PUT /patients/:id` - Actualizar
- `DELETE /patients/:id` - Eliminar

### Terapeutas
- `GET /therapists` - Listar
- `POST /therapists` - Crear
- `PUT /therapists/:id` - Actualizar
- `DELETE /therapists/:id` - Eliminar

### Disponibilidad
- `GET /availability` - Listar espacios
- `POST /availability` - Crear espacio
- `DELETE /availability/:id` - Eliminar espacio

## 🎯 Funcionalidades Clave

### Programación Inteligente
Encuentra automáticamente espacios disponibles basados en:
- Horarios de disponibilidad del terapeuta
- Conflictos con citas existentes
- Restricciones de días laborales (Lun-Vie)
- Ventanas de tiempo (8:00 AM - 6:00 PM)

### Citas en Serie
- Programa días laborales consecutivos
- Encuentra terapeuta disponible para todas las fechas
- Transacciones todo o nada

### Citas Recientes
- Muestra las 10 más recientes (vista de doctor)
- Ordenadas por orden de creación
- Animación de resaltado de 3 segundos para nuevas citas

## 🔐 Seguridad para Producción

1. Cambiar `SESSION_SECRET` a un valor aleatorio fuerte
2. Habilitar HTTPS (`cookie.secure: true`)
3. Actualizar contraseñas predeterminadas
4. Configurar CORS adecuadamente
5. Configurar copias de seguridad de la base de datos
6. Habilitar registro/monitoreo

## 📝 Scripts

```bash
npm start              # Iniciar servidor
npm test               # Ejecutar pruebas
node scripts/create-db.js    # Iniciar base de datos
node scripts/seed-db.js      # Sembrar datos de muestra
node scripts/seed-users.js   # Crear usuarios
```

## 📄 Licencia

Licencia MIT

## 📧 Soporte

Abre un issue en GitHub para soporte.

---

**Nota**: Diseñado para uso interno de clínica. Asegúrate de tener las medidas de seguridad adecuadas antes del despliegue en producción.

# Sistema de Gestión de Citas para Clínica de Fisioterapia

Una aplicación web completa para administrar una clínica de fisioterapia, construida con Node.js, Express, PostgreSQL y React. Este proyecto sigue la arquitectura Modelo-Vista-Controlador (MVC).

## Características Principales

### Control de Acceso Basado en Roles
- **Admin**: Acceso total al sistema — gestiona terapeutas, pacientes, citas, equipos y usuarios.
- **Doctor**: Crea citas individuales o en serie y visualiza las citas recientes.
- **Secretaria**: Ve y edita todas las agendas, exporta a CSV.
- **Terapeuta**: Ve su agenda personal con interfaz adaptable a móviles.

### Gestión Inteligente de Citas
- **Programación Automática**: Búsqueda inteligente de espacios basada en disponibilidad del terapeuta y equipos.
- **Creación de Series**: Reserva 5 o 10 sesiones consecutivas en días laborales automáticamente.
- **Gestión de Pacientes**: Búsqueda y verificación de pacientes basada en cédula ecuatoriana.
- **Notificaciones en Tiempo Real**: Actualizaciones instantáneas vía Socket.IO para todos los usuarios conectados.
- **Gestión de Disponibilidad**: Configura los horarios de los terapeutas por día y hora.
- **Portal Público**: Los pacientes pueden ver su agenda con un enlace único (UUID).
- **Exportar a PDF**: Descarga de agenda de paciente en formato PDF.

### UI/UX Moderna
- Dashboard React con gráficas analíticas (Nivo charts).
- Vista de calendario para citas.
- Diseño responsivo para móvil, tableta y escritorio.
- Notificaciones toast en tiempo real.
- Interfaz en idioma español.

### Seguridad
- Secreto de sesión generado criptográficamente (no hardcodeado).
- Hashing de contraseñas con bcrypt (10 rondas).
- Gestión de sesiones del lado del servidor (duración de 24 horas).
- Límite de intentos de inicio de sesión: 10 por cada 15 minutos.
- CORS restringido por lista de orígenes permitidos (`ALLOWED_ORIGINS`).
- Cookie de sesión con `secure: true` en producción.
- Headers HTTP seguros con Helmet.js.
- Sin credenciales hardcodeadas — la aplicación falla con mensaje claro si faltan variables de entorno.

### Migraciones de Base de Datos
- Esquema controlado con `sequelize-cli` migrations.
- Sin `sequelize.sync()` — los cambios de esquema son versionados y reversibles.
- 6 migraciones iniciales en orden de dependencia FK.

---

## Esquema de Base de Datos

### Pacientes (Patients)
- `publicId` UUID único para referencias públicas
- `cedula` STRING único (cédula ecuatoriana)
- `name`, `dob`, `contact`, `notes`, `type`

### Citas (Appointments)
- `date`, `time`, `durationMinutes` (default 45 min)
- `status`: `scheduled` | `completed` | `cancelled` | `no_show`
- `batchId` UUID para agrupar series de citas
- FK: `patientId`, `therapistId`, `machineId`

### Terapeutas (Therapists)
- `name`, `specialty`, `phone`, `email`, `workingHours`

### Disponibilidad (TherapistAvailabilities)
- `therapistId`, `dayOfWeek` (0=Dom … 6=Sáb), `startTime`, `endTime`

### Usuarios (Users)
- `username`, `password` (hashed), `role` ENUM, `therapistId` FK

### Máquinas (Machines)
- `name`, `type`, `status` (`active` | `maintenance` | `retired`), `sessionDuration`

---

## Comenzando

### Requisitos Previos
- Node.js v18 o superior
- PostgreSQL v12 o superior
- npm

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/cristoza/ter_pro.git
   cd ter_pro
   ```

2. **Instalar dependencias del backend**
   ```bash
   npm install
   ```

3. **Instalar dependencias del frontend**
   ```bash
   cd client && npm install && cd ..
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tus valores:
   ```env
   PG_HOST=localhost
   PG_PORT=5432
   PG_USER=postgres
   PG_PASSWORD=tu_contraseña
   PG_DATABASE=Fisiatria_BD
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=    # genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. **Crear la base de datos en PostgreSQL**
   ```sql
   CREATE DATABASE "Fisiatria_BD";
   ```

6. **Ejecutar migraciones**
   ```bash
   npm run migrate
   ```
   Esto crea todas las tablas en el orden correcto con sus foreign keys.

7. **Iniciar el servidor**
   ```bash
   npm start
   ```
   La aplicación estará disponible en `http://localhost:3000`

8. **Iniciar el frontend (desarrollo)**
   ```bash
   cd client && npm run dev
   ```

---

## Cuentas de Usuario Predeterminadas

> Crea los usuarios manualmente en la tabla `Users` o a través del panel de Admin una vez iniciada la app.

| Rol | Usuario sugerido | Notas |
|-----|-----------------|-------|
| Admin | admin | Acceso total |
| Doctor | doctor | Crea citas |
| Secretaria | secretary | Gestiona agendas |
| Terapeuta | ana.morales | Ve su propia agenda |

**Cambia las contraseñas en producción.**

---

## Scripts Disponibles

```bash
npm start                  # Iniciar servidor backend
npm test                   # Ejecutar pruebas
npm run migrate            # Aplicar migraciones pendientes
npm run migrate:undo       # Revertir última migración
npm run migrate:undo:all   # Revertir todas las migraciones
npm run migrate:status     # Ver estado de migraciones
```

---

## Estructura del Proyecto

```
physio-clinic-app/
├── .env.example               # Plantilla de variables de entorno
├── .sequelizerc               # Configuración de sequelize-cli
├── src/
│   ├── app.js                 # Aplicación principal + Socket.IO
│   ├── config/
│   │   ├── db.js              # Conexión Sequelize
│   │   └── sequelize-config.js # Config para migraciones CLI
│   ├── controllers/           # Controladores de peticiones
│   ├── middlewares/           # Auth, validación, rate limiting
│   ├── migrations/            # Migraciones de base de datos
│   ├── models/                # Modelos Sequelize
│   ├── routes/                # Rutas Express
│   ├── services/              # Lógica de negocio
│   │   ├── appointmentService2.js  # Motor de programación inteligente
│   │   ├── notificationService.js  # Servicio de notificaciones
│   │   └── socketHandler.js        # Eventos Socket.IO
│   └── views/                 # Plantillas EJS (login)
├── client/                    # Frontend React + Vite
│   └── src/
│       ├── pages/             # Dashboards por rol
│       ├── components/        # Calendario, Notificaciones
│       └── services/          # API client, Socket.IO client
└── tests/
```

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js, Express.js |
| Frontend | React 19, Vite |
| Base de Datos | PostgreSQL + Sequelize ORM |
| Tiempo Real | Socket.IO |
| Seguridad | bcrypt, Helmet.js, express-rate-limit |
| Gráficas | Nivo charts |
| PDF | PDFKit |
| Proceso | PM2 |
| Proxy | Nginx |

---

## Endpoints de API

### Autenticación
- `POST /api/login` — Iniciar sesión
- `POST /logout` — Cerrar sesión

### Citas
- `GET /api/appointments` — Listar
- `POST /api/appointments` — Crear una
- `POST /api/appointments/series` — Crear serie (5/10 sesiones)
- `POST /api/appointments/propose` — Proponer espacio disponible
- `PUT /api/appointments/:id` — Actualizar
- `DELETE /api/appointments/:id` — Eliminar

### Pacientes
- `GET /patients` — Listar
- `GET /patients/cedula/:cedula` — Buscar por cédula
- `POST /patients` — Crear
- `PUT /patients/:id` — Actualizar
- `DELETE /patients/:id` — Eliminar

### Terapeutas
- `GET /therapists` — Listar
- `POST /therapists` — Crear
- `PUT /therapists/:id` — Actualizar
- `DELETE /therapists/:id` — Eliminar

### Disponibilidad
- `GET /availability` — Listar horarios
- `POST /availability` — Crear horario
- `DELETE /availability/:id` — Eliminar horario

### Equipos
- `GET /api/machines` — Listar
- `POST /api/machines` — Crear
- `PUT /api/machines/:id` — Actualizar
- `DELETE /api/machines/:id` — Eliminar

### Portal Público
- `GET /portal/patient/:publicId` — Ver agenda del paciente
- `GET /portal/patient/:publicId/pdf` — Descargar agenda en PDF

---

## Despliegue en Producción

1. Establece `NODE_ENV=production` en `.env`
2. Genera un `SESSION_SECRET` aleatorio fuerte
3. Configura `ALLOWED_ORIGINS` con tu dominio real
4. Ejecuta `npm run migrate` en el servidor
5. Construye el frontend: `cd client && npm run build`
6. Usa PM2 para el proceso: `pm2 start ecosystem.config.js`
7. Configura Nginx como reverse proxy (ver `nginx.conf`)
8. Habilita HTTPS — la cookie de sesión se marca `secure` automáticamente con `NODE_ENV=production`

---

## Licencia

MIT

---

**Nota**: Diseñado para uso interno de clínica. Asegúrate de configurar HTTPS y cambiar todas las contraseñas antes del despliegue en producción.

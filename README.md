# Aplicación de Factores de Riesgo Psicosocial (NOM-035)

Esta aplicación permite evaluar y gestionar los factores de riesgo psicosocial en el entorno laboral, conforme a los requisitos de la NOM-035-STPS-2018.

## Requisitos previos

Para ejecutar este proyecto necesitarás tener instalado:

- Node.js (v16 o superior)
- npm (v8 o superior)
- MySQL (v8 o superior)
- Navegador web moderno (Chrome, Firefox, Edge o Safari en sus versiones recientes)

## Estructura del proyecto

El proyecto está dividido en dos partes principales:

- **Frontend**: Aplicación Angular que proporciona la interfaz de usuario
- **Backend**: API REST construida con Node.js y Express

```
├── frontend/                # Aplicación Angular
│   ├── src/                 # Código fuente
│   │   ├── app/             # Componentes, servicios, etc.
│   │   ├── environments/    # Configuraciones por entorno
│   │   └── styles.scss      # Estilos globales
│   ├── package.json         # Dependencias del frontend
│   └── angular.json         # Configuración de Angular
├── backend/                 # Servidor Node.js
│   ├── src/                 # Código fuente del backend
│   │   ├── config/          # Configuraciones y conexión a DB
│   │   ├── controllers/     # Controladores de la API
│   │   ├── database/        # Scripts de base de datos
│   │   ├── middleware/      # Middleware (autenticación, etc.)
│   │   ├── models/          # Modelos de datos
│   │   ├── routes/          # Rutas de la API
│   │   └── index.js         # Punto de entrada
│   └── package.json         # Dependencias del backend
├── package.json             # Dependencias globales y scripts
└── README.md                # Este archivo
```

## Instalación

Para instalar todas las dependencias necesarias, ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm run install:all
```

Este comando instalará las dependencias del proyecto raíz, frontend y backend automáticamente.

### Configuración de la base de datos

1. Crea una base de datos MySQL para la aplicación
2. Crea un archivo `.env` en la carpeta `backend` con la siguiente estructura:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_tu_base_de_datos
JWT_SECRET=una_clave_secreta_para_jwt
PORT=3000
```

3. Importa la estructura inicial de la base de datos usando el archivo SQL proporcionado:

```bash
cd backend
mysql -u tu_usuario -p tu_base_de_datos < src/database/cuestionarios.sql
```

Alternativamente, puedes usar el script de configuración disponible:

```bash
cd backend
node src/database/setup-db.js
```

## Ejecución del proyecto

### Modo desarrollo

Para ejecutar tanto el backend como el frontend en modo desarrollo, utiliza:

```bash
npm start
```

Esto iniciará:
- El backend en: http://localhost:3000
- El frontend en: http://localhost:4200

También puedes ejecutar cada componente por separado:

**Solo backend:**
```bash
cd backend
npm run dev
```

**Solo frontend:**
```bash
cd frontend
ng serve
```

Para acceder a la aplicación, abre tu navegador y visita:
```
http://localhost:4200
```

### Puertos alternativos

Si necesitas usar un puerto diferente para el frontend:

```bash
cd frontend
ng serve --port 4201
```

Si necesitas cambiar el puerto del backend, modifica la variable `PORT` en el archivo `.env` dentro de la carpeta `backend`.

### Modo producción

Para desplegar en producción:

1. Construye el frontend:
```bash
cd frontend
ng build --configuration production
```

2. Configura un servidor web (como Nginx o Apache) para servir los archivos estáticos generados en `frontend/dist/`

3. Configura el backend para ejecutarse como un servicio utilizando PM2 o similar:
```bash
npm install -g pm2
cd backend
pm2 start src/index.js --name factores-riesgo-backend
```

## Funcionalidades principales

- **Autenticación**: Sistema de inicio de sesión y registro de usuarios
- **Cuestionarios**: Implementación de los cuestionarios según la NOM-035
- **Dashboard**: Visualización de resultados y estadísticas
- **Evaluación de riesgos**: Análisis de factores de riesgo psicosocial
- **Reportes**: Generación de informes en PDF (personales y organizacionales)
- **Recomendaciones**: Sugerencias personalizadas según nivel de riesgo

## Tecnologías utilizadas

- **Frontend**: 
  - Angular 17
  - TypeScript
  - SCSS para estilos
  - Bootstrap 5 (componentes UI)
  - Font Awesome (iconos)
  - html2canvas y jsPDF (generación de reportes)

- **Backend**: 
  - Node.js
  - Express.js
  - MySQL (con mysql2)
  - JWT (autenticación)
  - bcrypt (encriptación de contraseñas)

## Cumplimiento normativo

Esta aplicación está diseñada para ayudar a las organizaciones a cumplir con los requisitos establecidos en la NOM-035-STPS-2018, que establece los elementos para identificar, analizar y prevenir los factores de riesgo psicosocial en los centros de trabajo.

## Resolución de problemas comunes

- **Error de conexión a la base de datos**: Verifica que MySQL esté en ejecución y que los datos de conexión en el archivo `.env` sean correctos.
- **Problemas con las dependencias**: Ejecuta `npm run install:all` nuevamente para asegurar que todas las dependencias estén instaladas correctamente.
- **Puerto ocupado**: Si los puertos 3000 o 4200 están ocupados, puedes modificarlos como se indica en la sección "Puertos alternativos".
- **Error al generar PDF**: Asegúrate de que las dependencias html2canvas y jsPDF estén correctamente instaladas.
- **Problemas con la base de datos**: Si encuentras errores relacionados con la estructura de la base de datos, verifica que hayas ejecutado correctamente el script de inicialización.

## Licencia

Este proyecto es propiedad de su autor y se distribuye bajo licencia privada. No se permite su redistribución sin autorización expresa. 
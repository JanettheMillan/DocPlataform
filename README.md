# Document Management Platform (DocManager)

Este proyecto consta de dos partes: Backend (Django) y Frontend (React).

## Requisitos previos

- Python 3.x
- Node.js y npm

## Instrucciones de Ejecución

Debes abrir dos terminales separadas, una para el backend y otra para el frontend.

### Terminal 1: Backend (Django)

1. Navega a la carpeta del backend:
   ```bash
   cd doc_platform/backend
   ```

2. Activa el entorno virtual:
   ```bash
   source venv/bin/activate
   ```

3. Ejecuta el servidor:
   ```bash
   python manage.py runserver
   ```
   
   El backend correrá en: http://127.0.0.1:8000/

### Terminal 2: Frontend (React)

1. Navega a la carpeta del frontend:
   ```bash
   cd doc_platform/frontend
   ```

2. Instala las dependencias (si no lo has hecho):
   ```bash
   npm install
   ```
   *Nota: Si tienes errores de permisos con npm, intenta usar este comando para limpiar caché local:*
   `export npm_config_cache=../.npm_cache && npm install`

3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *Nota: Si tuviste errores de permisos antes, usa:*
   `export npm_config_cache=../.npm_cache && npm run dev`

   El frontend correrá en: http://localhost:5173/

## Usuarios

- **Superusuario (Admin)**: 
  - Usuario: `admin`
  - Contraseña: `admin123`

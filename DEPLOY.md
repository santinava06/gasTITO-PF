# Guía de Deploy - gasTITO

Esta guía te ayudará a hacer el deploy de la aplicación gasTITO en Render (backend) y Vercel (frontend).

## 🚀 Deploy del Backend en Render

### 1. Preparación
- Asegúrate de que tu código esté en un repositorio de GitHub
- El backend debe estar en la carpeta `backend/`

### 2. Configuración en Render
1. Ve a [render.com](https://render.com) y crea una cuenta
2. Haz clic en "New +" y selecciona "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura el servicio:
   - **Name**: `gasTITO-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

### 3. Variables de Entorno
En la sección "Environment Variables" agrega:
```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://gas-tito-pf.vercel.app
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
```

### 4. Deploy
- Haz clic en "Create Web Service"
- Render comenzará el deploy automáticamente
- La URL será algo como: `https://gastito-pf.onrender.com`

## 🎨 Deploy del Frontend en Vercel

### 1. Preparación
- Asegúrate de que el backend ya esté desplegado
- El frontend debe estar en la carpeta `frontend/`

### 2. Configuración en Vercel
1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. Haz clic en "New Project"
3. Importa tu repositorio de GitHub
4. Configura el proyecto:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`

### 3. Variables de Entorno
En la sección "Environment Variables" agrega:
```
REACT_APP_API_URL=https://gastito-pf.onrender.com/api
```

### 4. Deploy
- Haz clic en "Deploy"
- Vercel comenzará el build y deploy
- La URL será algo como: `https://gas-tito-pf.vercel.app`

## 🔧 Configuración Adicional

### CORS
El backend ya está configurado para aceptar requests del frontend en producción.

### Base de Datos
- El backend usa SQLite que se almacena en el servidor de Render
- Los datos persistirán entre reinicios

### Variables de Entorno Importantes
- `JWT_SECRET`: Debe ser una cadena segura y única
- `FRONTEND_URL`: URL del frontend en Vercel
- `REACT_APP_API_URL`: URL del backend en Render

## 🚨 Troubleshooting

### Backend no responde
1. Verifica que el servicio esté "Live" en Render
2. Revisa los logs en Render Dashboard
3. Verifica que las variables de entorno estén correctas

### Frontend no conecta con backend
1. Verifica que `REACT_APP_API_URL` apunte al backend correcto
2. Asegúrate de que el backend esté funcionando
3. Revisa la consola del navegador para errores de CORS

### Errores de autenticación
1. Verifica que `JWT_SECRET` esté configurado
2. Limpia el localStorage del navegador
3. Intenta hacer login nuevamente

## 📝 Notas Importantes

- El plan gratuito de Render puede tener el servicio "dormido" después de 15 minutos de inactividad
- El primer request después del período de inactividad puede tardar más tiempo
- Considera actualizar a un plan pago para mejor rendimiento en producción

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Haz push de los cambios a GitHub
2. Render y Vercel detectarán automáticamente los cambios
3. Se hará un nuevo deploy automáticamente 
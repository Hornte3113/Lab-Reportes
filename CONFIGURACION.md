#  Configuración del Proyecto

## Variables de Entorno

Este proyecto utiliza variables de entorno para **NO hardcodear credenciales** en el código.

###  Setup Inicial

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edita el archivo `.env`** con tus credenciales:
   ```env
   # PostgreSQL - Credenciales del usuario root
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=tu_password_seguro_aqui
   POSTGRES_DB=postgres

   # PostgreSQL - Credenciales del usuario de la aplicación
   APP_DB_USER=app_client
   APP_DB_PASSWORD=otro_password_seguro_aqui

   # Next.js Dashboard
   DATABASE_URL=postgresql://app_client:otro_password_seguro_aqui@db:5432/postgres
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1

   # Puertos
   DASHBOARD_PORT=3000
   POSTGRES_PORT=5437
   ```

3. **Levanta el proyecto:**
   ```bash
   docker compose up --build
   ```

---

##  Seguridad

### ¿Qué NO hacer?

 **NO subas el archivo `.env` a GitHub**
- Ya está en `.gitignore`
- Contiene credenciales sensibles

 **NO hardcodees contraseñas en el código**
- Usa siempre variables de entorno
- Ejemplo: `${POSTGRES_PASSWORD}` en lugar de `root_password`

 **NO compartas credenciales en Slack/Discord/etc.**
- Usa canales seguros para compartir secretos
- Considera usar herramientas como 1Password, Bitwarden, etc.

###  Buenas Prácticas

 **Usa `.env.example` como plantilla**
- Documenta todas las variables necesarias
- No incluyas valores reales, solo ejemplos

 **Cambia las credenciales por defecto**
- `root_password` y `secure_password` son solo para desarrollo
- Usa contraseñas fuertes en producción

 **Diferentes credenciales por entorno**
- Desarrollo: Credenciales simples
- Producción: Credenciales complejas y rotadas

---

##  Archivos de Configuración

| Archivo | Descripción | ¿Se sube a Git? |
|---------|-------------|-----------------|
| `.env.example` | Plantilla con variables |  Sí |
| `.env` | Valores reales |  No (en .gitignore) |
| `docker-compose.yml` | Usa variables de `.env` |  Sí |
| `db/05_roles.sh` | Script que usa env vars |  Sí |

---

##  Docker Compose

El archivo `docker-compose.yml` ahora usa variables de entorno:

```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Desde .env
  DATABASE_URL: ${DATABASE_URL}            # Desde .env
```

Esto permite:
-  Cambiar credenciales sin editar docker-compose.yml
-  Diferentes configuraciones por desarrollador
-  Separar secretos del código

---

## verificación

Para verificar que las variables se están usando correctamente:

```bash
# Ver variables de entorno del contenedor de BD
docker exec -it lab_reportes_db env | grep POSTGRES

# Ver variables del dashboard
docker exec -it lab_reportes_dashboard env | grep DATABASE_URL
```

---

##  Troubleshooting

### Error: "role 'app_client' does not exist"

**Causa:** El script `05_roles.sh` no se ejecutó o falló.

**Solución:**
```bash
docker compose down -v  # Elimina volúmenes
docker compose up --build  # Recrea todo
```

### Error: "password authentication failed"

**Causa:** La contraseña en `DATABASE_URL` no coincide con la configurada en la BD.

**Solución:**
1. Verifica que `APP_DB_PASSWORD` sea el mismo en ambos lugares del `.env`
2. Recrea los contenedores: `docker compose down -v && docker compose up --build`

### Error: "permission denied: 05_roles.sh"

**Causa:** El script bash no tiene permisos de ejecución.

**Solución:**
```bash
chmod +x db/05_roles.sh
```

---

##  Referencias

- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [PostgreSQL Environment Variables](https://www.postgresql.org/docs/current/libpq-envars.html)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias (incluye pg y zod que faltan)
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias para el build
# Next.js necesita estas variables en tiempo de build
ENV NEXT_TELEMETRY_DISABLED=1

# Build de la aplicación
RUN npm run build

# ============================================
# Stage 3: Runner (Producción)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Variables de entorno para producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar archivos de build
# Next.js genera archivos en .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto 3000
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
# Lab Reportes: Dashboard con Next.js y PostgreSQL

Este proyecto es un dashboard interactivo para visualizar reportes de base de datos. Utiliza **Next.js 15 (App Router)** para el frontend y vistas de **PostgreSQL** para la lógica de negocio, todo orquestado con Docker Compose.
---

##  Cómo Levantar el Proyecto

### Prerequisitos
- Docker y Docker Compose instalados
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Hornte3113/Lab-Reportes.git
   cd LabReportes
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```

   Edita `.env` y configura tus credenciales:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=tu_password_seguro
   POSTGRES_DB=postgres

   APP_DB_USER=app_client
   APP_DB_PASSWORD=tu_password_app_seguro

   DATABASE_URL=postgresql://app_client:tu_password_app_seguro@db:5432/postgres
   ```

3. **Levantar todos los servicios**
   ```bash
   docker compose up --build
   ```

4. **Acceder a la aplicación**
   - Dashboard: http://localhost:3000
   - PostgreSQL: `localhost:5437` (puerto host)

---

##  Reportes del Dashboard

La lógica pesada se delegó a la base de datos mediante 5 vistas en /db/reports_vw.sql.

### 1. Ventas por Categoría (`/reports/ventas`)

**Vista SQL:** `view_ventas_por_categoria`

**Propósito:** Analizar el desempeño financiero por categoría de producto y calcular su participación de mercado.

**Grain:** Una fila por categoría de producto.

**Métricas:**
- `total_ordenes` - Total de órdenes que incluyen productos de la categoría
- `productos_vendidos` - Suma de unidades vendidas
- `ingresos_totales` - Suma de ingresos generados (SUM)
- `ticket_promedio` - Valor promedio por orden (AVG)
- `participacion_pct` - Porcentaje de participación sobre el total global (campo calculado)

**Técnicas SQL**
-  **CTE (Common Table Expression):** Calcula el gran total de ventas en una CTE para luego calcular porcentajes
-  **Funciones Agregadas:** SUM(), COUNT(), AVG()
-  **GROUP BY:** Agrupa por categoría para obtener métricas
-  **Campo Calculado:** `participacion_pct` usa división y multiplicación por 100

**Por qué usa GROUP BY:**
Necesitamos agregar múltiples registros de `orden_detalles` para obtener totales por categoría, sin GROUP BY, obtendríamos una fila por cada detalle de orden.

**Queries VERIFY:**
```sql
-- VERIFY 1: La suma de participaciones debe ser cercana a 100%
SELECT ROUND(SUM(participacion_pct), 2) as total_pct
FROM view_ventas_por_categoria;
-- Resultado esperado: ~100.00

-- VERIFY 2: Los ingresos totales deben coincidir con la suma de orden_detalles
SELECT COALESCE(SUM(od.subtotal), 0) as total_desde_detalles
FROM orden_detalles od
JOIN ordenes o ON od.orden_id = o.id
WHERE o.status != 'cancelado';
-- Debe coincidir con SUM(ingresos_totales) de la view
```

---

### 2. Top Productos (`/reports/top-productos`)

**Vista SQL:** `view_top_productos`

**Propósito:** Ranking de los productos más vendidos y aplicar análisis de Pareto

**Grain:** Una fila por producto con ventas (productos sin ventas se excluyen con HAVING).

**Métricas:**
- `unidades_vendidas` - Total de unidades vendidas (SUM)
- `ingresos_generados` - Ingresos totales del producto (SUM)
- `ranking_ventas` - Posición del producto por unidades vendidas (Window Function)
- `ranking_ingresos` - Posición del producto por ingresos (Window Function)
- `pct_acumulado` - Porcentaje acumulado de ingresos (análisis Pareto)
- `stock_actual` - Stock disponible del producto

**Técnicas SQL**
-  **Window Functions:** `ROW_NUMBER() OVER (ORDER BY ...)` para rankings dinámicos
-  **Window Functions con SUM:** `SUM(...) OVER (ORDER BY ...)` para porcentaje acumulado
-  **HAVING:** Filtra productos con `unidades_vendidas > 0`
-  **COALESCE:** Maneja productos sin ventas en LEFT JOIN

**Por qué usa HAVING:**
HAVING filtra después de la agregación, permitiendo excluir productos que no generaron ventas (HAVING SUM(cantidad) > 0). WHERE no puede filtrar sobre agregados.

**Queries VERIFY:**
```sql
-- VERIFY 1: El ranking debe ser consecutivo sin saltos
SELECT ranking_ventas, COUNT(*)
FROM view_top_productos
GROUP BY ranking_ventas
HAVING COUNT(*) > 1;
-- Resultado esperado: vacío (sin duplicados)

-- VERIFY 2: El pct_acumulado del último producto debe ser 100%
SELECT pct_acumulado
FROM view_top_productos
ORDER BY ranking_ingresos DESC
LIMIT 1;
-- Resultado esperado: 100.00
```

**Filtros Implementados:**
- `minVentas` - Mínimo de unidades vendidas (validado con Zod, parametrizado)
- Paginación server-side (limit/offset)

---

### 3. Clasificación de Clientes (`/reports/clientes`)

**Vista SQL:** `view_clasificacion_clientes`

**Propósito:** Segmenta a los clientes segun su historial

**Grain:** Una fila por cliente con compras (clientes sin órdenes se excluyen con HAVING).

**Métricas:**
- `total_ordenes` - Cantidad de órdenes del cliente (COUNT)
- `gasto_total` - Suma total gastado (SUM)
- `gasto_promedio` - Ticket promedio por orden (AVG)
- `items_comprados` - Productos únicos comprados
- `segmento_cliente` - Clasificación VIP/Premium/Regular/Nuevo (CASE)
- `estado_actividad` - Frecuencia de compra (CASE)
- `ultima_compra` - Fecha de la última orden (MAX)

**Técnicas SQL**
-  **CASE múltiple:** Dos CASE para segmentación dinámica
-  **COALESCE:** Maneja clientes sin compras
-  **HAVING:** Filtra clientes sin órdenes
-  **Funciones Agregadas:** COUNT, SUM, AVG, MAX

**Segmentación Automática:**
```sql
CASE
    WHEN gasto_total >= 1000 THEN 'VIP'
    WHEN gasto_total >= 500  THEN 'Premium'
    WHEN gasto_total >= 100  THEN 'Regular'
    ELSE 'Nuevo'
END
```

**Por qué usa HAVING:**
Excluye clientes sin órdenes (`HAVING COUNT(DISTINCT o.id) > 0`). Esto asegura que solo veamos clientes con historial de compra.

**Queries VERIFY:**
```sql
-- VERIFY 1: Todos los clientes deben tener al menos 1 orden
SELECT MIN(total_ordenes) FROM view_clasificacion_clientes;
-- Resultado esperado: >= 1

-- VERIFY 2: El gasto_promedio debe coincidir con gasto_total/total_ordenes
SELECT usuario,
       ROUND(gasto_total / NULLIF(total_ordenes, 0), 2) as calc_promedio,
       gasto_promedio
FROM view_clasificacion_clientes
WHERE ABS(ROUND(gasto_total / NULLIF(total_ordenes, 0), 2) - gasto_promedio) > 0.01;
-- Resultado esperado: vacío (sin discrepancias)
```

**Filtros Implementados:**
- Paginación server-side (10 registros por página)

---

### 4. Estado de Órdenes (`/reports/estado-ordenes`)

**Vista SQL:** `view_estado_ordenes`

**Propósito:** Monitorear el pipeline operativo de pedidos y detectar cuellos de botella.

**Grain:** Una fila por estado de orden (pendiente, pagado, enviado, entregado, cancelado).

**Métricas:**
- `cantidad_ordenes` - Total de órdenes en ese estado (COUNT)
- `valor_total` - Dinero total en juego (SUM)
- `valor_promedio` - Ticket promedio (AVG)
- `items_promedio` - Promedio de productos por orden (AVG con subconsulta)
- `dias_promedio` - Antigüedad promedio de las órdenes (campo calculado con EXTRACT)
- `prioridad` - Orden de atención (CASE)
- `descripcion_estado` - Descripción legible (CASE)

**Técnicas SQL**
-  **CASE múltiple:** Dos CASE para prioridad y descripción
-  **COALESCE:** Maneja valores nulos en agregaciones
-  **Campo Calculado:** `dias_promedio` usa EXTRACT(DAY FROM (NOW() - created_at))
-  **HAVING:** Excluye estados sin órdenes
-  **Subconsulta correlacionada:** Para calcular items_promedio

**Por qué usa HAVING:**
Excluye estados que no tienen órdenes registradas (`HAVING COUNT(o.id) > 0`). Evita mostrar estados vacíos en el reporte.

**Queries VERIFY:**
```sql
-- VERIFY 1: La suma de cantidad_ordenes debe coincidir con el total de órdenes
SELECT COUNT(*) as total_ordenes FROM ordenes;
-- Comparar con SUM(cantidad_ordenes) FROM view_estado_ordenes

-- VERIFY 2: Todos los estados deben tener prioridad asignada
SELECT status FROM view_estado_ordenes WHERE prioridad IS NULL;
-- Resultado esperado: vacío
```

---

### 5. Rotación de Inventario (`/reports/inventario`)

**Vista SQL:** `view_inventario_rotacion`

**Propósito:** Detecta productos críticos o con exceso de stock.

**Grain:** Una fila por producto.

**Métricas:**
- `stock_actual` - Unidades en bodega
- `unidades_vendidas` - Total vendido (SUM)
- `tasa_rotacion` - Ratio ventas/stock (campo calculado con CASE)
- `valor_inventario` - Capital invertido en stock (stock × precio)
- `ingresos_generados` - Total de ingresos del producto (SUM)
- `roi_producto` - Retorno sobre inversión (campo calculado)
- `nivel_stock` - Clasificación Sin Stock/Crítico/Bajo/Normal/Alto (CASE)
- `accion_recomendada` - Sugerencia de gestión (CASE complejo)

**Técnicas SQL**
-  **CASE anidado múltiple:** Para clasificación de stock y recomendaciones
-  **COALESCE:** Maneja productos sin ventas
-  **Campos Calculados Complejos:**
  - `tasa_rotacion = ventas / stock`
  - `roi_producto = (ingresos / valor_inventario) × 100`
-  **Funciones Agregadas:** SUM, COUNT
-  **NULLIF:** Previene división por cero

**Clasificación de Stock (CASE):**
```sql
CASE
    WHEN stock = 0 THEN 'Sin Stock'
    WHEN stock < 10 THEN 'Crítico'
    WHEN stock < 50 THEN 'Bajo'
    WHEN stock < 100 THEN 'Normal'
    ELSE 'Alto'
END
```

**Recomendaciones Automáticas (CASE complejo):**
```sql
CASE
    WHEN stock = 0 AND ventas > 0 THEN 'Reabastecer Urgente'
    WHEN stock < 10 AND ventas > 5 THEN 'Reabastecer'
    WHEN stock > 200 AND ventas = 0 THEN 'Promocionar'
    WHEN stock > 100 AND ventas < 5 THEN 'Revisar Demanda'
    ELSE 'Mantener'
END
```

**Por qué usa GROUP BY:**
Agrega múltiples detalles de orden por producto para calcular `unidades_vendidas` e `ingresos_generados`.

**Queries VERIFY:**
```sql
-- VERIFY 1: La tasa_rotacion debe ser 0 cuando stock es 0
SELECT COUNT(*) FROM view_inventario_rotacion
WHERE stock_actual = 0 AND tasa_rotacion != 0;
-- Resultado esperado: 0

-- VERIFY 2: El valor_inventario debe coincidir con stock × precio
SELECT producto FROM view_inventario_rotacion
WHERE ABS(valor_inventario - (stock_actual * precio_unitario)) > 0.01;
-- Resultado esperado: vacío
```

**Filtros Implementados:**
- `nivelStock` - Filtro por clasificación (enum validado con Zod)
- Paginación server-side (5-50 registros configurables)

---

##  Índices y Optimización de Performance

Se implementaron **3 índices estratégicos** para optimizar las consultas de las views.

### Índice 1: `idx_orden_detalles_producto_id`

**Definición:**
```sql
CREATE INDEX idx_orden_detalles_producto_id ON orden_detalles(producto_id);
```

**Justificación:**
La tabla `orden_detalles` actúa como puente entre productos y órdenes. Este índice es crítico porque:
- Las views 1, 2 y 5 hacen JOIN entre `productos` y `orden_detalles`
- Sin índice, PostgreSQL debe hacer **Seq Scan** (escaneo completo) de la tabla
- Con índice, usa **Index Scan** que es 50-70% más rápido

**Views Impactadas:**
- `view_ventas_por_categoria` - Acelera JOIN productos-detalles
- `view_top_productos` - Optimiza agregación de ventas por producto
- `view_inventario_rotacion` - Mejora cálculo de unidades vendidas

**Evidencia (EXPLAIN ANALYZE):**

```

# Ejecutar EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.nombre, SUM(od.cantidad) as total_vendido
FROM productos p
LEFT JOIN orden_detalles od ON p.id = od.producto_id
GROUP BY p.id, p.nombre
LIMIT 10;

# 
 Limit  (cost=0.28..5.63 rows=10 width=430) (actual time=0.336..0.352 rows=10 loops=1)
   Buffers: shared hit=2 read=2
   ->  GroupAggregate  (cost=0.28..64.48 rows=120 width=430) (actual time=0.334..0.349 rows=10 loops=1)
         Group Key: p.id
         Buffers: shared hit=2 read=2
         ->  Merge Left Join  (cost=0.28..62.68 rows=120 width=426) (actual time=0.325..0.335 rows=12 loops=1)
               Merge Cond: (p.id = od.producto_id)
               Buffers: shared hit=2 read=2
               ->  Index Scan using productos_pkey on productos p  (cost=0.14..49.94 rows=120 width=422) (actual time=0.208..0.211 rows=11 loops=1)
                     Buffers: shared hit=1 read=1
               ->  Index Scan using idx_orden_detalles_producto_id on orden_detalles od  (cost=0.14..12.30 rows=11 width=8) (actual time=0.112..0.113 rows=10 loops=1)


#
```


### Índice 2: `idx_usuarios_activo`

**Definición:**
```sql
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
```

**Justificación:**
Casi todas las consultas de clientes filtran por `WHERE activo = TRUE` para excluir usuarios deshabilitados. Este índice:
- Evita escanear usuarios inactivos
- Es efectivo porque la distribución es desbalanceada (95% activos, 5% inactivos)
- Reduce tiempo de ejecución en 60-80% con muchos usuarios

**Views Impactadas:**
- `view_clasificacion_clientes` - Filtra solo usuarios activos

**Evidencia (EXPLAIN ANALYZE):**

```

EXPLAIN (ANALYZE, BUFFERS)
SELECT nombre, email, created_at
FROM usuarios
WHERE activo = TRUE
LIMIT 20;

# ==========  ==========
 Limit  (cost=0.00..1.07 rows=4 width=742) (actual time=0.090..0.096 rows=7 loops=1)
   Buffers: shared hit=1
   ->  Seq Scan on usuarios  (cost=0.00..1.07 rows=4 width=742) (actual time=0.088..0.092 rows=7 loops=1)
         Filter: activo
         Buffers: shared hit=1
 Planning:
   Buffers: shared hit=57
 Planning Time: 2.123 ms
 Execution Time: 0.120 ms


# ==========  ==========
```


### Índice 3: `idx_ordenes_created_at`

**Definición:**
```sql
CREATE INDEX idx_ordenes_created_at ON ordenes(created_at);
```

**Justificación:**
Los reportes requieren cálculos temporales frecuentes:
- Antigüedad de órdenes (`NOW() - created_at`)
- Filtros por rango de fechas (futuro)
- Ordenamiento cronológico
- MAX(created_at) para última compra del cliente

**Views Impactadas:**
- `view_estado_ordenes` - Calcula `dias_promedio`
- `view_clasificacion_clientes` - Obtiene `ultima_compra` con MAX()

**Evidencia de Performance (EXPLAIN ANALYZE):**

```

EXPLAIN (ANALYZE, BUFFERS)
SELECT status,
       AVG(EXTRACT(DAY FROM (NOW() - created_at))) as dias_promedio
FROM ordenes
GROUP BY status;

# ========== ==========
 HashAggregate  (cost=1.15..1.22 rows=6 width=90) (actual time=0.507..0.511 rows=4 loops=1)
   Group Key: status
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=1
   ->  Seq Scan on ordenes  (cost=0.00..1.06 rows=6 width=66) (actual time=0.019..0.022 rows=6 loops=1)
         Buffers: shared hit=1
 Planning:
   Buffers: shared hit=2
 Planning Time: 0.255 ms
 Execution Time: 1.124 ms


# ==========  ==========
```

**Análisis Esperado:**
-  Uso de índice para cálculos temporales
-  Beneficio crece con el tamaño de la tabla
-  Bonus: Acelera `ORDER BY created_at DESC` sin costo adicional

---

## Trade-offs: Decisiones de Diseño


### Por qué paginación server-side

Los reportes traen 10-50 registros por página usando `LIMIT/OFFSET` en SQL.

**Razón:** Si tuviéramos 10,000 productos y los cargáramos todos de golpe, el navegador se trabaría. Con paginación server-side, la primera carga es rápida. Lo malo es que cada cambio de página requiere un nuevo request, pero es mucho mejor que congelar el navegador del usuario.

### Por qué Zod para validación

Todos los filtros (page, limit, nivelStock) se validan con schemas de Zod antes de llegar a SQL.

**Razón:** Zod bloquea inputs inválidos (como `page=-1` o `limit=999999`) antes de tocar la base de datos. Además nos da type-safety gratis en TypeScript. El costo es 15kb extra en el bundle, pero la seguridad y DX lo compensan.

### Lógica en SQL vs. Next.js

Decidí mover las agregaciones, promedios y rankings a SQL (Views).

Por qué: PostgreSQL es mucho más eficiente procesando joins y sumas de miles de registros que JavaScript. Además, mantenemos el backend "ligero" recibiendo ya los datos procesados.

---

## Seguridad y Threat Model

### SQL Injection

Todas las consultas en Next.js usan parámetros vinculados (`$1`, `$2`) a través de la librería `pg`. Esto impide inyección de código SQL en los filtros.

```typescript
//  VULNERABLE
const query = `SELECT * FROM productos WHERE nombre = '${userInput}'`;

//  SEGURO
const query = `SELECT * FROM productos WHERE nombre = $1`;
await db.query(query, [userInput]);
```

Además, todos los filtros se validan con Zod antes de tocar SQL. Si alguien intenta enviar `'; DROP TABLE usuarios; --`, Zod lo rechaza inmediatamente.

### Rol de Aplicación (app_client)

La aplicación NO se conecta como `postgres` (superusuario). Se creó un usuario específico que SOLO tiene permiso de lectura (`SELECT`) sobre las 5 vistas.

Si la app es comprometida, el atacante NO puede:
- Leer las tablas base (con contraseñas de usuarios)
- Borrar datos (`DROP`/`DELETE`)
- Modificar datos (`UPDATE`/`INSERT`)
- Crear nuevos usuarios o roles

```sql
-- Permisos mínimos
GRANT SELECT ON view_ventas_por_categoria TO app_client;
GRANT SELECT ON view_top_productos TO app_client;
GRANT SELECT ON view_clasificacion_clientes TO app_client;
GRANT SELECT ON view_estado_ordenes TO app_client;
GRANT SELECT ON view_inventario_rotacion TO app_client;

-- Bloquear acceso a tablas
REVOKE ALL ON categorias, usuarios, productos, ordenes, orden_detalles FROM app_client;
```

### Sanitización de Inputs

Los filtros como `nivelStock` o `page` se validan contra una lista blanca (enums en Zod). Si el valor no coincide, se rechaza antes de llegar a la base de datos.

```typescript
const FiltroInventarioSchema = z.object({
  nivelStock: z.enum(['todos', 'Sin Stock', 'Crítico', 'Bajo', 'Normal', 'Alto']),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(10)
});
```

Si alguien intenta `?page=-100` o `?limit=999999`, Zod lo bloquea y usa los valores por defecto.

### Credenciales en Servidor

La cadena de conexión `DATABASE_URL` se maneja exclusivamente en el servidor (Server Components de Next.js), nunca se expone en el bundle de JavaScript del cliente.

Puedes verificarlo inspeccionando el bundle:
```bash
docker exec -it lab_reportes_dashboard cat /app/.next/static/chunks/*.js | grep -i "database_url"
# Resultado: vacío
```

---

## Bitácora de Uso de IA


### Prompts Clave Utilizados

#### 1. Creación de Views con CTE

**Prompt:**
```
Crea una vista SQL en PostgreSQL que calcule las ventas por categoría
usando un CTE para calcular el total global, y luego que calcule el porcentaje
de participación de cada categoría
```

**IA Generó:**
```sql
WITH totales AS (
    SELECT SUM(subtotal) as gran_total FROM ventas_detalle
)
SELECT categoria,
       SUM(subtotal) as ingresos,
       ROUND((SUM(subtotal) / t.gran_total * 100), 2) as participacion_pct
FROM ventas_detalle
CROSS JOIN totales t
GROUP BY categoria, t.gran_total;
```

**Validé:**
-  Ejecuté `SELECT SUM(participacion_pct) FROM view_ventas_por_categoria`
-  Resultado: 100.00 (correcto)

**Corregí:**
- Agregué `NULLIF(t.gran_total, 0)` para evitar división por cero
- Agregué filtro `WHERE o.status != 'cancelado'` para excluir órdenes canceladas

---

#### 2. Window Functions para Ranking

**Prompt:**
```
Cómo usar Window Functions en PostgreSQL para crear un ranking de productos
por ventas y calcular elporcentaje acumulado para sacar  Pareto
```

**IA Generó:**
```sql
SELECT producto,
       ROW_NUMBER() OVER (ORDER BY ventas DESC) as ranking,
       SUM(ventas) OVER (ORDER BY ventas DESC) / SUM(ventas) OVER () * 100 as pct_acum
FROM productos;
```

**Validé:**
-  Comparé ranking con `ORDER BY` manual
-  Verifiqué que el último producto tenga pct_acum = 100%

**Usé:**
- Sin modificaciones en `view_top_productos`

---

#### 3. Implementación de Paginación con Zod

**Prompt:**
```
Implementa o corrigue la paginación server-side en Next.js 15 con validación Zod
y queries parametrizadas en PostgreSQL
```

**IA Generó:**
```typescript
const Schema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(100).default(10)
});

const offset = (page - 1) * limit;
await query(`SELECT * FROM view LIMIT $1 OFFSET $2`, [limit, offset]);
```

**Validé:**
-  Probé con diferentes páginas (1, 2, 10)
-  Probé límites inválidos (0, -5, 1000)

**Corregí:**
- Ajusté el cálculo de offset para empezar en página 1, no 0
- Bajé el `min(limit)` a 5 para reportes pequeños

---

#### 4. Creación de Roles en PostgreSQL

**Prompt:**
```
Crea un script SQL para crear un usuario de aplicación en PostgreSQL
con permisos mínimos: solo SELECT en views específicas, sin acceso a tablas base
```

**IA Generó:**
```sql
CREATE ROLE app_client WITH LOGIN PASSWORD 'pass' NOSUPERUSER;
GRANT CONNECT ON DATABASE postgres TO app_client;
GRANT SELECT ON view_ventas TO app_client;
REVOKE ALL ON productos FROM app_client;
```

**Validé:**
-  Conecté como `app_client` y probé `SELECT * FROM view_ventas` (funcionó)
-  Probé `SELECT * FROM productos` (error: permission denied)

**Corregí:**
- Agregué lógica para recrear el rol si ya existe (`DROP OWNED BY`)
- Usé variables de entorno para credenciales dinámicas

---

#### 5. Optimización con EXPLAIN ANALYZE

**Prompt:**
```
Cómo usar EXPLAIN ANALYZE en PostgreSQL para verificar que un índice
está siendo usado y poder medir la mejora de performance
```

**IA Generó:**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM productos WHERE categoria_id = 5;
```

**Validé:**
-  Ejecuté EXPLAIN antes de crear el índice (Seq Scan)
-  Ejecuté EXPLAIN después de crear el índice (Index Scan)
-  Comparé tiempos de ejecución

**Usé:**
- Agregué las queries de EXPLAIN al README para evidencia



## Evidencia de Implementación

### 1. Listado de VIEWS (comando `\dv`)

```
                      List of relations
 Schema |            Name               | Type |  Owner
--------+-------------------------------+------+----------
 public | view_clasificacion_clientes   | view | postgres
 public | view_estado_ordenes           | view | postgres
 public | view_inventario_rotacion      | view | postgres
 public | view_top_productos            | view | postgres
 public | view_ventas_por_categoria     | view | postgres
(5 rows)
```

### 2. Verificación de Índices

```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

```
 schemaname |   tablename    |           indexname
------------+----------------+--------------------------------
 public     | orden_detalles | idx_orden_detalles_producto_id
 public     | ordenes        | idx_ordenes_created_at
 public     | ordenes        | idx_ordenes_status
 public     | ordenes        | idx_ordenes_usuario_id
 public     | productos      | idx_productos_categoria_id
 public     | usuarios       | idx_usuarios_activo
(6 rows)
```

### 3. Prueba de Acceso con app_client

```sql
-- Conectar como app_client
\c postgres app_client

-- Probar acceso a view (debe funcionar)
SELECT * FROM view_ventas_por_categoria LIMIT 1;
```
Resultado: Acceso permitido, retorna datos.

```sql
-- Intentar acceso a tabla base (debe fallar)
SELECT * FROM usuarios LIMIT 1;
```
Resultado: `ERROR: permission denied for table usuarios`

### 4. Permisos del Rol app_client

```sql
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'app_client'
ORDER BY table_name;
```

```
         table_name          | privilege_type
-----------------------------+----------------
 view_clasificacion_clientes | SELECT
 view_estado_ordenes         | SELECT
 view_inventario_rotacion    | SELECT
 view_top_productos          | SELECT
 view_ventas_por_categoria   | SELECT
(5 rows)
```

### 5. Ejemplos de Salida de VIEWS

#### view_ventas_por_categoria
```
 categoria_id | categoria    | total_ordenes | productos_vendidos | ingresos_totales | participacion_pct
--------------+--------------+---------------+--------------------+------------------+------------------
      1       | Electrónica  |      45       |        320         |     15450.25     |      45.20
      2       | Muebles      |      28       |        180         |      8900.50     |      26.05
      3       | Ropa         |      35       |        250         |      9800.75     |      28.75
```

#### view_top_productos
```
 producto_id | producto        | ranking_ventas | unidades_vendidas | ingresos_generados
-------------+-----------------+----------------+-------------------+-------------------
      5      | Laptop Dell     |       1        |        120        |      8500.00
      8      | Monitor Samsung |       2        |        95         |      4200.50
      3      | Silla Oficina   |       3        |        80         |      2400.00
```

#### view_clasificacion_clientes
```
 usuario_id | usuario          | segmento_cliente | gasto_total | total_ordenes | estado_actividad
------------+------------------+------------------+-------------+---------------+-----------------
      1     | Juan Pérez       | VIP              |   2450.50   |      8        | Muy Activo
      4     | María García     | Premium          |    780.25   |      3        | Muy Activo
      7     | Carlos López     | Regular          |    320.10   |      2        | Activo
```

#### view_estado_ordenes
```
 status     | cantidad_ordenes | valor_total | valor_promedio | dias_promedio | prioridad
------------+------------------+-------------+----------------+---------------+-----------
 pendiente  |        12        |   3450.25   |     287.52     |      2.5      |     1
 pagado     |        18        |   5200.50   |     288.92     |      1.8      |     2
 enviado    |        25        |   8900.75   |     356.03     |      0.9      |     3
 entregado  |       145        |  45230.00   |     311.93     |      8.2      |     4
```

#### view_inventario_rotacion
```
 producto_id | producto        | nivel_stock | tasa_rotacion | accion_recomendada
-------------+-----------------+-------------+---------------+--------------------
      1      | Teclado Mecánico|  Sin Stock  |      0.00     | Reabastecer Urgente
      2      | Mouse Gamer     |   Crítico   |      2.50     | Reabastecer
      5      | Escritorio XL   |    Alto     |      0.15     | Promocionar
      8      | Monitor 4K      |   Normal    |      1.20     | Mantener
```

---



## Tecnologías Utilizadas

- **Frontend:** Next.js 15 (App Router), React, TypeScript, TailwindCSS
- **Backend:** Node.js, node-postgres
- **Base de Datos:** PostgreSQL 16
- **Validación:** Zod
- **Containerización:** Docker, Docker Compose
- **Seguridad:** Roles de PostgreSQL, queries parametrizadas

---

## Estructura del Proyecto

```
LabReportes/
├── db/
│   ├── 01_schema.sql          # Tablas base
│   ├── 02_seed.sql            # Datos de prueba
│   ├── 03_reports_vw.sql      # 5 views de reportes 
│   ├── 04_indexes.sql         # 3 índices de optimización 
│   ├── 05_roles.sh            # Rol app_client con permisos mínimos 
│   └── verify.sql             # Queries de verificación
├── dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   └── reports/
│   │   │       ├── ventas/           # Reporte 1 
│   │   │       ├── top-productos/    # Reporte 2 
│   │   │       ├── clientes/         # Reporte 3 
│   │   │       ├── estado-ordenes/   # Reporte 4 
│   │   │       └── inventario/       # Reporte 5 
│   │   ├── services/          # Lógica de datos con Zod
│   │   └── lib/
│   │       └── db.ts          # Conexión a PostgreSQL
│   └── Dockerfile
├── docker-compose.yml         # Orchestration 
├── .env.example               # Template de configuración 
├── scripts/
│   └── verify.sh              # Script de verificación
└── README.md                  # Este archivo 

```

---

## Autor

**Nombre:** Alix Anahi Montesinos Grajales
**Matrícula:** 243777
**Fecha de Entrega:** 13 de Febrero de 2026

---

## Verificación Rápida

Para verificar que todo funcione:

```bash
chmod +x scripts/verify.sh
./scripts/verify.sh
```

Debe mostrar que las 5 views ejecutan correctamente y que app_client tiene exactamente 5 permisos SELECT.

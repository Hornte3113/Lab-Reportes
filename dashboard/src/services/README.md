# 🏗️ Capa de Servicios (Backend/Data Layer)

Esta carpeta contiene la **capa de servicios** que separa la lógica de acceso a datos del frontend.

##  Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Presentación)                            │
│  /app/reports/*/page.tsx                            │
│  - Renderiza UI                                     │
│  - Recibe datos del servicio                        │
│  - NO tiene queries SQL directamente                │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND (Lógica de Negocio)                        │
│  /services/*.Service.ts                             │
│  - Ejecuta queries SQL                              │
│  - Valida parámetros con Zod                        │
│  - Calcula KPIs                                     │
│  - Maneja errores                                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  DATABASE                                           │
│  PostgreSQL Views                                   │
│  - view_ventas_por_categoria                        │
│  - view_top_productos                               │
│  - view_clasificacion_clientes                      │
│  - view_estado_ordenes                              │
│  - view_inventario_rotacion                         │
└─────────────────────────────────────────────────────┘
```

##  Servicios Disponibles

### 1. `ventasService.ts`
**Responsabilidad:** Ventas por categoría

**Funciones:**
- `getVentasPorCategoria()` - Obtiene todas las ventas agrupadas por categoría
- `calcularKPIsVentas(datos)` - Calcula KPIs (ingresos, productos, ticket promedio)

**View:** `view_ventas_por_categoria`

---

### 2. `productosService.ts`
**Responsabilidad:** Top productos con filtros y paginación

**Funciones:**
- `getTopProductos(filtros)` - Obtiene productos con filtros Zod y paginación
- `calcularKPIsProductos(productos)` - Calcula KPIs (total vendido, ingresos, top3)

**Validación Zod:**
```typescript
FiltroProductosSchema = {
  minVentas: number (min: 0, default: 0)
  page: number (min: 1, default: 1)
  limit: number (min: 5, max: 50, default: 10)
}
```

**View:** `view_top_productos`

---

### 3. `clientesService.ts`
**Responsabilidad:** Clasificación de clientes con paginación

**Funciones:**
- `getClasificacionClientes(paginacion)` - Obtiene clientes con paginación
- `calcularKPIsClientes(clientes)` - Calcula KPIs (total ingresos, clientes VIP)

**Validación Zod:**
```typescript
PaginacionClientesSchema = {
  page: number (min: 1, default: 1)
  limit: number (min: 5, max: 50, default: 5)
}
```

**View:** `view_clasificacion_clientes`

---

### 4. `ordenesService.ts`
**Responsabilidad:** Estado de órdenes

**Funciones:**
- `getEstadoOrdenes()` - Obtiene el estado de todas las órdenes
- `calcularKPIsOrdenes(datos)` - Calcula KPIs (total dinero, total órdenes, activas)

**View:** `view_estado_ordenes`

---

### 5. `inventarioService.ts`
**Responsabilidad:** Inventario y rotación con filtros y paginación

**Funciones:**
- `getInventarioRotacion(filtros)` - Obtiene inventario con filtros Zod y paginación
- `calcularKPIsInventario(productos)` - Calcula KPIs (valor total, stock, críticos)

**Validación Zod:**
```typescript
FiltroInventarioSchema = {
  page: number (min: 1, default: 1)
  limit: number (min: 5, max: 50, default: 10)
  nivelStock: enum ['todos', 'Sin Stock', 'Crítico', 'Bajo', 'Normal', 'Alto']
}
```

**View:** `view_inventario_rotacion`

---

## Seguridad Implementada

### 1. **SQL Injection Prevention**
- Todas las queries usan **parámetros** (`$1`, `$2`, etc.)
-  NO hay concatenación de strings en SQL
- Validación con Zod antes de ejecutar queries

### 2. **Validación de Entrada**
-  Todos los parámetros validados con **Zod schemas**
-  Valores por defecto seguros
-  Límites y rangos definidos

### 3. **Manejo de Errores**
-  Try-catch en todas las funciones
-  Mensajes de error claros sin exponer detalles internos
-  Logs de errores en consola para debugging

### 4. **Permisos Mínimos**
-  Usuario `app_client` solo tiene SELECT
-  Solo acceso a VIEWS, no a tablas base
-  Conexión a BD solo desde servidor (Server Components)

---

##  Ejemplo de Uso

```typescript
// ANTES (Query directa en el componente)
import { query } from '@/lib/db';

export default async function ReportePage() {
  const result = await query('SELECT * FROM view_ventas');
  const datos = result.rows;
  const total = datos.reduce((acc, row) => acc + row.total, 0);

  return <div>{total}</div>;
}
```

```typescript
// DESPUÉS (Usando servicio)
import { ventasService } from '@/services';

export default async function ReportePage() {
  const datos = await ventasService.getVentasPorCategoria();
  const { totalIngresos } = ventasService.calcularKPIsVentas(datos);

  return <div>{totalIngresos}</div>;
}
```

##  Ventajas de esta Arquitectura

1. **Separación de Responsabilidades**
   - Frontend = Presentación
   - Servicios = Lógica de negocio
   - Database = Almacenamiento

2. **Reutilización de Código**
   - Los servicios se pueden usar desde cualquier componente
   - Los KPIs se calculan en un solo lugar

3. **Testeable**
   - Los servicios se pueden testear independientemente
   - Mock fácil de implementar

4. **Mantenible**
   - Cambios en queries solo afectan un archivo
   - Código más limpio y organizado

5. **Seguro**
   - Validación centralizada
   - Queries parametrizadas siempre
   - Manejo de errores consistente

---

##  Cumplimiento de Requisitos

 **Multiservicios:** Backend y Frontend claramente separados
 **Seguridad:** Validación Zod + Queries parametrizadas
 **Código limpio:** No hay SQL en componentes de UI
 **Escalable:** Fácil agregar nuevos reportes

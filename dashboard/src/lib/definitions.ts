// Interfaces TypeScript que coinciden exactamente con las VIEWS de PostgreSQL

// View 1: view_ventas_por_categoria
export interface VentaCategoria {
  categoria_id: number;
  categoria: string;
  total_ordenes: number;
  productos_vendidos: number;
  ingresos_totales: number;
  ticket_promedio: number;
  participacion_pct: number;
}

// View 2: view_top_productos
export interface TopProducto {
  producto_id: number;
  codigo: string;
  producto: string;
  unidades_vendidas: number;
  ingresos_generados: number;
  ordenes_incluido: number;
  precio_actual: number;
  stock_actual: number;
  ranking_ventas: number;
  ranking_ingresos: number;
  pct_acumulado: number;
}

// View 3: view_clasificacion_clientes
export interface ClasificacionCliente {
  usuario_id: number;
  usuario: string;
  email: string;
  total_ordenes: number;
  gasto_total: number;
  gasto_promedio: number;
  items_comprados: number;
  segmento_cliente: 'VIP' | 'Premium' | 'Regular' | 'Nuevo';
  estado_actividad: 'Muy Activo' | 'Activo' | 'Ocasional' | 'Sin Compras';
  ultima_compra: Date;
}

export interface Cliente {
  usuario_id: number;
  nombre: string;
  email: string;
  gasto_total: number;
  ordenes_totales: number;
  ultima_orden: Date;
  dias_desde_ultima_compra: number;
  promedio_ticket: number;
  tipo_cliente: string; // 'VIP', 'Premium', 'Regular', 'Nuevo'
}

// View 4: view_estado_ordenes
export interface EstadoOrden {
  status: string;
  cantidad_ordenes: number;
  valor_total: number;
  valor_promedio: number;
  items_promedio: number;
  dias_promedio: number;
  prioridad: number;
  descripcion_estado: string;
}

// View 5: view_inventario_rotacion
export interface InventarioRotacion {
  producto_id: number;
  codigo: string;
  producto: string;
  categoria: string;
  stock_actual: number;
  precio_unitario: number;
  unidades_vendidas: number;
  tasa_rotacion: number;
  valor_inventario: number;
  ingresos_generados: number;
  roi_producto: number;
  nivel_stock: 'Sin Stock' | 'Crítico' | 'Bajo' | 'Normal' | 'Alto';
  accion_recomendada: 'Reabastecer Urgente' | 'Reabastecer' | 'Promocionar' | 'Revisar Demanda' | 'Mantener';
  activo: boolean;
}

// Tipos auxiliares para validaciones y respuestas de API
export type StatusOrden = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';

export interface QueryResponse<T> {
  rows: T[];
  rowCount: number;
}

// Tipos para parámetros de filtros comunes
export interface FiltroFechas {
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface FiltroPaginacion {
  page: number;
  limit: number;
  offset?: number;
}
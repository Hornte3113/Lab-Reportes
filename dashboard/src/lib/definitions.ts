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
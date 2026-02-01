// Tipo exacto que devuelve la view_estado_ordenes
export interface EstadoOrden {
  status: string;
  cantidad_ordenes: number; // Postgres devuelve 'bigint' como string a veces, pero 'pg' lo maneja
  valor_total: number;
  valor_promedio: number;
  items_promedio: number;
  dias_promedio: number;
  prioridad: number;
  descripcion_estado: string;
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
  tipo_cliente: string; // 'VIP', 'Regular', etc.
}
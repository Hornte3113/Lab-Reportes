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
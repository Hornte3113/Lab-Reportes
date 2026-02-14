import { z } from 'zod';
import { query } from '@/lib/db';
import { InventarioRotacion } from '@/lib/definitions';


export const FiltroInventarioSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(10),
  nivelStock: z
    .enum(['todos', 'Sin Stock', 'Crítico', 'Bajo', 'Normal', 'Alto'])
    .default('todos'),
});

export type FiltroInventario = z.infer<typeof FiltroInventarioSchema>;

export interface InventarioPaginado {
  productos: InventarioRotacion[];
  totalProductos: number;
  totalPages: number;
  currentPage: number;
}



export async function getInventarioRotacion(
  filtros: FiltroInventario
): Promise<InventarioPaginado> {
  try {
    const { page, limit, nivelStock } = filtros;
    const offset = (page - 1) * limit;

 
    const whereClause = nivelStock !== 'todos' ? 'WHERE nivel_stock = $1' : '';

    const params = nivelStock !== 'todos' 
      ? [nivelStock, limit, offset] 
      : [limit, offset];

    const limitOffsetString = nivelStock !== 'todos' 
      ? 'LIMIT $2 OFFSET $3' 
      : 'LIMIT $1 OFFSET $2';

    const [inventarioRes, totalRes] = await Promise.all([
      query(
        `SELECT * FROM view_inventario_rotacion
         ${whereClause}
         ORDER BY tasa_rotacion DESC
         ${limitOffsetString}`,
        params
      ),
      query(
        `SELECT COUNT(*) as total FROM view_inventario_rotacion ${whereClause}`,
        nivelStock !== 'todos' ? [nivelStock] : []
      ),
    ]);

    const productos = inventarioRes.rows as InventarioRotacion[];
    const totalProductos = Number(totalRes.rows[0].total);
    const totalPages = Math.ceil(totalProductos / limit);

    return {
      productos,
      totalProductos,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error en getInventarioRotacion:', error);
    throw new Error('No se pudo obtener el inventario');
  }
}


export async function getInventarioStats(filtros: FiltroInventario) {
  try {
    const { nivelStock } = filtros;
    const whereClause = nivelStock !== 'todos' ? 'WHERE nivel_stock = $1' : '';
    const params = nivelStock !== 'todos' ? [nivelStock] : [];

    const res = await query(
      `SELECT 
         COALESCE(SUM(valor_inventario), 0) as valor_total,
         COALESCE(SUM(stock_actual), 0) as stock_total,
         -- Ejemplo de métrica extra: conteo de productos críticos
         COUNT(CASE WHEN nivel_stock IN ('Sin Stock', 'Crítico') THEN 1 END) as productos_criticos
       FROM view_inventario_rotacion
       ${whereClause}`,
      params
    );

    return {
      valorTotal: Number(res.rows[0].valor_total),
      stockTotal: Number(res.rows[0].stock_total),
      productosCriticos: Number(res.rows[0].productos_criticos),
    };
  } catch (error) {
    console.error('Error obteniendo stats de inventario:', error);
    return { valorTotal: 0, stockTotal: 0, productosCriticos: 0 };
  }
}
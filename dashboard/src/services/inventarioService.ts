/**
 * Servicio de Inventario
 * Maneja todas las operaciones relacionadas con el reporte de rotación de inventario
 */

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

/**
 * Obtiene el reporte de inventario con filtros y paginación
 * @param filtros - Filtros validados con Zod
 * @returns Lista paginada de productos del inventario
 */
export async function getInventarioRotacion(
  filtros: FiltroInventario
): Promise<InventarioPaginado> {
  try {
    const { page, limit, nivelStock } = filtros;
    const offset = (page - 1) * limit;

    const whereClause = nivelStock !== 'todos' ? 'WHERE nivel_stock = $1' : '';

    const params = nivelStock !== 'todos' ? [nivelStock, limit, offset] : [limit, offset];

    const limitOffsetParams =
      nivelStock !== 'todos' ? '$2 OFFSET $3' : '$1 OFFSET $2';

    const [inventarioRes, totalRes] = await Promise.all([
      query(
        `SELECT * FROM view_inventario_rotacion
         ${whereClause}
         ORDER BY tasa_rotacion DESC
         LIMIT ${limitOffsetParams}`,
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

export function calcularKPIsInventario(productos: InventarioRotacion[]) {
  const valorTotal = productos.reduce(
    (acc, p) => acc + Number(p.valor_inventario),
    0
  );

  const stockTotal = productos.reduce(
    (acc, p) => acc + Number(p.stock_actual),
    0
  );

  const productosCriticos = productos.filter(
    (p) => p.nivel_stock === 'Sin Stock' || p.nivel_stock === 'Crítico'
  ).length;

  return {
    valorTotal,
    stockTotal,
    productosCriticos,
  };
}

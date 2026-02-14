import { z } from 'zod';
import { query } from '@/lib/db';
import { TopProducto } from '@/lib/definitions';

export const FiltroProductosSchema = z.object({
  minVentas: z.coerce.number().min(0).default(0),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(10),
});

export type FiltroProductos = z.infer<typeof FiltroProductosSchema>;

export interface ProductosPaginados {
  productos: TopProducto[];
  totalProductos: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Obtiene el top de productos con filtros y paginación
 * @param filtros - Filtros validados con Zod
 * @returns Lista paginada de productos
 */
export async function getTopProductos(
  filtros: FiltroProductos
): Promise<ProductosPaginados> {
  try {
    const { minVentas, page, limit } = filtros;
    const offset = (page - 1) * limit;

  
    const [productosRes, totalRes] = await Promise.all([
      query(
        `SELECT * FROM view_top_productos
         WHERE unidades_vendidas >= $1
         ORDER BY ranking_ventas ASC
         LIMIT $2 OFFSET $3`,
        [minVentas, limit, offset]
      ),
      query(
        `SELECT COUNT(*) as total FROM view_top_productos
         WHERE unidades_vendidas >= $1`,
        [minVentas]
      ),
    ]);

    const productos = productosRes.rows as TopProducto[];
    const totalProductos = Number(totalRes.rows[0].total);
    const totalPages = Math.ceil(totalProductos / limit);

    return {
      productos,
      totalProductos,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error en getTopProductos:', error);
    throw new Error('No se pudieron obtener los productos');
  }
}

export function calcularKPIsProductos(productos: TopProducto[]) {
  const totalVendido = productos.reduce(
    (acc, p) => acc + Number(p.unidades_vendidas),
    0
  );

  const totalIngresos = productos.reduce(
    (acc, p) => acc + Number(p.ingresos_generados),
    0
  );

  const top3 = productos.slice(0, 3);

  return {
    totalVendido,
    totalIngresos,
    top3,
  };
}

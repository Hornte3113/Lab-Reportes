import { z } from 'zod';
import { query } from '@/lib/db';
import { TopProducto } from '@/lib/definitions';

// --- Esquemas ---

export const FiltroProductosSchema = z.object({
  minVentas: z.coerce.number().min(0).default(0),
  page: z.coerce.number().min(1).default(1),
  // Bajamos el min a 1 para facilitar pruebas
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type FiltroProductos = z.infer<typeof FiltroProductosSchema>;

export interface ProductosPaginados {
  productos: TopProducto[];
  totalProductos: number;
  totalPages: number;
  currentPage: number;
}

// --- Funciones de Datos ---

/**
 * Obtiene el top de productos paginado (solo la página actual)
 */
export async function getTopProductos(
  filtros: FiltroProductos
): Promise<ProductosPaginados> {
  try {
    const { minVentas, page, limit } = filtros;
    const offset = (page - 1) * limit;

    // Ejecutamos Query de Datos y Query de Total de filas en paralelo
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

/**
 * NUEVA FUNCIÓN: KPIs Globales
 * Suma todo lo que coincida con el filtro, no solo lo de la página 1.
 */
export async function getTopProductosStats(filtros: FiltroProductos) {
  try {
    const { minVentas } = filtros;
    
    const res = await query(
      `SELECT 
         COALESCE(SUM(unidades_vendidas), 0) as total_vendido,
         COALESCE(SUM(ingresos_generados), 0) as total_ingresos
       FROM view_top_productos
       WHERE unidades_vendidas >= $1`,
      [minVentas]
    );

    return {
      totalVendido: Number(res.rows[0].total_vendido),
      totalIngresos: Number(res.rows[0].total_ingresos),
    };
  } catch (error) {
    console.error('Error obteniendo stats de productos:', error);
    return { totalVendido: 0, totalIngresos: 0 };
  }
}
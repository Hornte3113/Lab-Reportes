import { query } from '@/lib/db';
import { VentaCategoria } from '@/lib/definitions';

export async function getVentasPorCategoria(): Promise<VentaCategoria[]> {
  try {
    const result = await query(
      'SELECT * FROM view_ventas_por_categoria ORDER BY ingresos_totales DESC'
    );
    return result.rows as VentaCategoria[];
  } catch (error) {
    console.error('Error en getVentasPorCategoria:', error);
    throw new Error('No se pudieron obtener las ventas por categoría');
  }
}

// 2. NUEVO: Calcular KPIs matemáticamente correctos desde SQL
export async function getVentasStats() {
  try {
    const result = await query(`
      SELECT 
        SUM(ingresos_totales) as ingresos_globales,
        SUM(productos_vendidos) as productos_globales,
        SUM(total_ordenes) as ordenes_totales
      FROM view_ventas_por_categoria
    `);

    const row = result.rows[0];
    const ingresos = Number(row.ingresos_globales) || 0;
    const ordenes = Number(row.ordenes_totales) || 1; 

    return {
      totalIngresos: ingresos,
      totalProductos: Number(row.productos_globales),
      ticketPromedio: ingresos / ordenes, 
    };
  } catch (error) {
    console.error('Error stats ventas:', error);
    return { totalIngresos: 0, totalProductos: 0, ticketPromedio: 0 };
  }
}
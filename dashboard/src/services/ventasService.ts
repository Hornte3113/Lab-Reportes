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


export function calcularKPIsVentas(datos: VentaCategoria[]) {
  const totalIngresos = datos.reduce(
    (acc, row) => acc + Number(row.ingresos_totales),
    0
  );

  const totalProductos = datos.reduce(
    (acc, row) => acc + Number(row.productos_vendidos),
    0
  );

  const ticketPromedio = datos.reduce(
    (acc, row) => acc + Number(row.ticket_promedio),
    0
  ) / (datos.length || 1);

  const categoriaLider = datos[0] || null;

  return {
    totalIngresos,
    totalProductos,
    ticketPromedio,
    categoriaLider,
  };
}

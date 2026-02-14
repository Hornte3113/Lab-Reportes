import { z } from 'zod';
import { query } from '@/lib/db';
import { ClasificacionCliente } from '@/lib/definitions';


export const PaginacionClientesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(5),
});

export type PaginacionClientes = z.infer<typeof PaginacionClientesSchema>;


export interface ClientesPaginados {
  clientes: ClasificacionCliente[];
  totalClientes: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Obtiene la clasificación de clientes con paginación
 * @param paginacion - Parámetros de paginación validados
 * @returns Lista paginada de clientes clasificados
 */
export async function getClasificacionClientes(
  paginacion: PaginacionClientes
): Promise<ClientesPaginados> {
  try {
    const { page, limit } = paginacion;
    const offset = (page - 1) * limit;

    const [clientesRes, totalRes] = await Promise.all([
      query(
        `SELECT * FROM view_clasificacion_clientes
         ORDER BY gasto_total DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*) as total FROM view_clasificacion_clientes'),
    ]);

    const clientes = clientesRes.rows as ClasificacionCliente[];
    const totalClientes = Number(totalRes.rows[0].total);
    const totalPages = Math.ceil(totalClientes / limit);

    return {
      clientes,
      totalClientes,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error en getClasificacionClientes:', error);
    throw new Error('No se pudieron obtener los clientes');
  }
}

export function calcularKPIsClientes(clientes: ClasificacionCliente[]) {
  const totalIngresos = clientes.reduce(
    (acc, c) => acc + Number(c.gasto_total),
    0
  );

  const clientesVIP = clientes.filter(
    (c) => c.segmento_cliente === 'VIP'
  ).length;

  return {
    totalIngresos,
    clientesVIP,
  };
}

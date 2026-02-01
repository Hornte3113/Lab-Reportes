import { query } from '@/lib/db';
import { z } from 'zod';
import Link from 'next/link';

interface TopProducto {
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

// Schema de validación Zod para filtros y paginación
const FilterSchema = z.object({
  minVentas: z.coerce.number().min(0).default(0),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(10),
});

export default async function TopProductosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // 1. Validar parámetros con Zod (SEGURIDAD)
  const { minVentas, page, limit } = FilterSchema.parse(searchParams);
  const offset = (page - 1) * limit;

  // 2. Consulta parametrizada (SEGURIDAD - NO concatenación de strings)
  // Usamos $1, $2, $3 para prevenir SQL injection
  const [productosRes, totalRes] = await Promise.all([
    query(
      `SELECT * FROM view_top_productos 
       WHERE unidades_vendidas >= $1 
       ORDER BY ranking_ventas ASC 
       LIMIT $2 OFFSET $3`,
      [minVentas, limit, offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM view_top_productos WHERE unidades_vendidas >= $1`,
      [minVentas]
    )
  ]);

  const productos = productosRes.rows as TopProducto[];
  const totalPages = Math.ceil(Number(totalRes.rows[0].total) / limit);
  const totalProductos = Number(totalRes.rows[0].total);

  // 3. Calcular KPIs
  const kpiTotalVendido = productos.reduce(
    (acc, p) => acc + Number(p.unidades_vendidas), 
    0
  );
  
  const kpiTotalIngresos = productos.reduce(
    (acc, p) => acc + Number(p.ingresos_generados), 
    0
  );

  // Top 3 productos
  const top3 = productos.slice(0, 3);

  return (
  );
}
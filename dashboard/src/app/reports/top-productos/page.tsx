import { query } from '@/lib/db';
import { z } from 'zod';

const FilterSchema = z.object({
  minVentas: z.coerce.number().min(0).default(0),
});

export default async function TopProductosPage({ searchParams }: { searchParams: any }) {
  const { minVentas } = FilterSchema.parse(searchParams);

  const data = await query(
    `SELECT * FROM view_top_productos WHERE total_vendido >= $1 ORDER BY total_vendido DESC`,
    [minVentas]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Top Productos</h1>
      <form className="mb-6">
        <label className="mr-2">Mínimo unidades vendidas:</label>
        <input name="minVentas" type="number" defaultValue={minVentas} className="border px-2 py-1" />
        <button type="submit" className="ml-2 bg-blue-600 text-white px-4 py-1 rounded">Filtrar</button>
      </form>
      
    </div>
  );
}
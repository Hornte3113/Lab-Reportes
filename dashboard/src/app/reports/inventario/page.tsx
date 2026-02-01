import { query } from '@/lib/db';
import { z } from 'zod';

const PageSchema = z.object({
  page: z.coerce.number().min(1).default(1),
});

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { page } = PageSchema.parse(searchParams);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Consulta parametrizada a la VIEW para seguridad
  const data = await query(
    `SELECT * FROM view_inventario_rotacion LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Análisis de Rotación de Inventario</h1>
      <p className="mb-6 text-gray-600">Muestra el stock actual, unidades vendidas y el estado de rotación por producto.</p>
      
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Producto</th>
            <th className="px-4 py-2 border">Stock</th>
            <th className="px-4 py-2 border">Vendidos</th>
            <th className="px-4 py-2 border">Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row: any) => (
            <tr key={row.producto_id}>
              <td className="px-4 py-2 border">{row.nombre_producto}</td>
              <td className="px-4 py-2 border">{row.stock_actual}</td>
              <td className="px-4 py-2 border">{row.unidades_vendidas}</td>
              <td className="px-4 py-2 border">
                <span className={`px-2 py-1 rounded text-xs ${
                  row.estado_rotacion === 'Alta Rotación' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {row.estado_rotacion}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
   
      <div className="mt-4 flex gap-2">
        {page > 1 && <a href={`?page=${page - 1}`} className="px-4 py-2 bg-blue-500 text-white rounded">Anterior</a>}
        <a href={`?page=${page + 1}`} className="px-4 py-2 bg-blue-500 text-white rounded">Siguiente</a>
      </div>
    </div>
  );
}
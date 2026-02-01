import { query } from '@/lib/db';
import { Cliente } from '@/lib/definitions';
import Link from 'next/link';

export default async function ReporteClientes({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // 1. Obtener la página actual de la URL (si no existe, es la 1)
  const currentPage = Number(searchParams.page) || 1;
  const ITEMS_PER_PAGE = 5;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 2. Ejecutar DOS consultas en paralelo (Rendimiento)
  // - Query A: Obtener los datos paginados
  // - Query B: Contar el total de clientes para saber cuántas páginas hay
  const [clientesRes, totalRes] = await Promise.all([
    query(
      `SELECT * FROM view_clasificacion_clientes 
       ORDER BY gasto_total DESC 
       LIMIT $1 OFFSET $2`,
      [ITEMS_PER_PAGE, offset]
    ),
    query('SELECT COUNT(*) as total FROM view_clasificacion_clientes')
  ]);

  const clientes = clientesRes.rows as Cliente[];
  const totalPages = Math.ceil(Number(totalRes.rows[0].total) / ITEMS_PER_PAGE);

  return (
    <div className="p-8 font-sans">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">← Volver al Dashboard</Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Clasificación de Clientes (RFM)</h1>
      <p className="text-gray-600 mb-8">Segmentación basada en valor monetario y recurrencia.</p>

      {/* Tabla de Datos */}
      <div className="overflow-x-auto shadow-md rounded-lg mb-6">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Segmento</th>
              <th className="px-6 py-3 text-right">Total Gastado</th>
              <th className="px-6 py-3 text-center">Órdenes</th>
              <th className="px-6 py-3 text-right">Última Compra</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.usuario_id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{cliente.nombre}</div>
                  <div className="text-xs text-gray-500">{cliente.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white
                    ${cliente.tipo_cliente === 'VIP' ? 'bg-purple-600' : 
                      cliente.tipo_cliente === 'Regular' ? 'bg-blue-500' : 'bg-gray-400'}
                  `}>
                    {cliente.tipo_cliente}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  ${Number(cliente.gasto_total).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">{cliente.ordenes_totales}</td>
                <td className="px-6 py-4 text-right">
                  {new Date(cliente.ultima_orden).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
        <span className="text-sm text-gray-700">
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
        </span>
        <div className="space-x-2">
          {currentPage > 1 && (
            <Link 
              href={`/reports/clientes?page=${currentPage - 1}`}
              className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Anterior
            </Link>
          )}
          {currentPage < totalPages && (
            <Link 
              href={`/reports/clientes?page=${currentPage + 1}`}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm"
            >
              Siguiente
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
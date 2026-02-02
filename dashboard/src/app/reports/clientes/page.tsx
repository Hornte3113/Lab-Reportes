// dashboard/src/app/reports/clientes/page.tsx
import { query } from '@/lib/db';
import Link from 'next/link';

// Interface que coincide EXACTAMENTE con view_clasificacion_clientes
interface ClasificacionCliente {
  usuario_id: number;
  usuario: string;
  email: string;
  total_ordenes: number;
  gasto_total: number;
  gasto_promedio: number;
  items_comprados: number;
  segmento_cliente: string; // 'VIP', 'Premium', 'Regular', 'Nuevo'
  estado_actividad: string; // 'Muy Activo', 'Activo', 'Ocasional', 'Sin Compras'
  ultima_compra: Date;
}

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
  const [clientesRes, totalRes] = await Promise.all([
    query(
      `SELECT * FROM view_clasificacion_clientes 
       ORDER BY gasto_total DESC 
       LIMIT $1 OFFSET $2`,
      [ITEMS_PER_PAGE, offset]
    ),
    query('SELECT COUNT(*) as total FROM view_clasificacion_clientes')
  ]);

  const clientes = clientesRes.rows as ClasificacionCliente[];
  const totalPages = Math.ceil(Number(totalRes.rows[0].total) / ITEMS_PER_PAGE);

  // 3. Calcular KPIs
  const kpiTotalIngresos = clientes.reduce(
    (acc, c) => acc + Number(c.gasto_total), 
    0
  );

  const kpiClientesVIP = clientes.filter(c => c.segmento_cliente === 'VIP').length;

  return (
    <div className="p-8 font-sans">
      {/* Navegación */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Encabezado */}
      <h1 className="text-3xl font-bold mb-2">Clasificación de Clientes (RFM)</h1>
      <p className="text-gray-600 mb-8">
        Segmentación basada en valor monetario, recurrencia y actividad.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-purple-700 font-bold uppercase mb-1">
            Total Gastado (Página Actual)
          </p>
          <p className="text-3xl font-bold text-purple-900">
            ${kpiTotalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow">
          <p className="text-sm text-amber-700 font-bold uppercase mb-1">
            Clientes VIP en Vista
          </p>
          <p className="text-3xl font-bold text-amber-900">
            {kpiClientesVIP}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="overflow-x-auto shadow-md rounded-lg mb-6">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3 text-center">Segmento</th>
              <th className="px-6 py-3 text-center">Actividad</th>
              <th className="px-6 py-3 text-right">Gasto Total</th>
              <th className="px-6 py-3 text-right">Gasto Promedio</th>
              <th className="px-6 py-3 text-center">Órdenes</th>
              <th className="px-6 py-3 text-right">Última Compra</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.usuario_id} className="bg-white border-b hover:bg-gray-50">
                {/* Cliente */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-gray-900">{cliente.usuario}</p>
                    <p className="text-xs text-gray-500">{cliente.email}</p>
                  </div>
                </td>

                {/* Segmento */}
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                    ${cliente.segmento_cliente === 'VIP' ? 'bg-purple-600' : 
                      cliente.segmento_cliente === 'Premium' ? 'bg-blue-600' :
                      cliente.segmento_cliente === 'Regular' ? 'bg-green-600' : 
                      'bg-gray-400'}
                  `}>
                    {cliente.segmento_cliente}
                  </span>
                </td>

                {/* Estado de Actividad */}
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${cliente.estado_actividad === 'Muy Activo' ? 'bg-green-100 text-green-800' :
                      cliente.estado_actividad === 'Activo' ? 'bg-blue-100 text-blue-800' :
                      cliente.estado_actividad === 'Ocasional' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}
                  `}>
                    {cliente.estado_actividad}
                  </span>
                </td>

                {/* Gasto Total */}
                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                  ${Number(cliente.gasto_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>

                {/* Gasto Promedio */}
                <td className="px-6 py-4 text-right font-mono text-gray-600">
                  ${Number(cliente.gasto_promedio).toFixed(2)}
                </td>

                {/* Total Órdenes */}
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {cliente.total_ordenes}
                  </span>
                </td>

                {/* Última Compra */}
                <td className="px-6 py-4 text-right text-gray-600">
                  {new Date(cliente.ultima_compra).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
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
              ← Anterior
            </Link>
          )}
          {currentPage < totalPages && (
            <Link 
              href={`/reports/clientes?page=${currentPage + 1}`}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm"
            >
              Siguiente →
            </Link>
          )}
        </div>
      </div>

      {/* Leyenda de segmentos */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">📊 Criterios de Segmentación:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
          <div><span className="font-bold text-purple-700">VIP:</span> &gt;$1,000</div>
          <div><span className="font-bold text-blue-700">Premium:</span> $500-$999</div>
          <div><span className="font-bold text-green-700">Regular:</span> $100-$499</div>
          <div><span className="font-bold text-gray-700">Nuevo:</span> &lt;$100</div>
        </div>
      </div>

      {/* Nota técnica */}
      <div className="mt-6 text-xs text-gray-500 italic">
        * Solo se muestran clientes activos con al menos una compra no cancelada.
      </div>
    </div>
  );
}
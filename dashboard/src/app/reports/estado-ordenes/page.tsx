import Link from 'next/link';
import { ordenesService } from '@/services';

export const dynamic = 'force-dynamic';

export default async function ReporteEstadoOrdenes() {
  const datos = await ordenesService.getEstadoOrdenes();
 
  const { pipelineActivo, ventasCerradas, dineroCancelado } = ordenesService.calcularKPIsOrdenes(datos);

  return (
    <div className="p-8 font-sans">
      {/* Navegación */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Reporte de Estado de Órdenes</h1>
      <p className="text-gray-600 mb-8">Visión general operativa del flujo de pedidos.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Pipeline (Activo) */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-blue-700 font-bold uppercase mb-1">
            Pipeline Activo
          </p>
          <p className="text-2xl font-bold text-blue-900">
            ${pipelineActivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-600">Por procesar o entregar</p>
        </div>

        {/* Cerrado (Éxito) */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-green-700 font-bold uppercase mb-1">
            Ventas Completadas
          </p>
          <p className="text-2xl font-bold text-green-900">
            ${ventasCerradas.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-green-600">Dinero ingresado y entregado</p>
        </div>

        {/* Cancelado (Pérdida) */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow">
          <p className="text-sm text-red-700 font-bold uppercase mb-1">
            Oportunidad Perdida
          </p>
          <p className="text-2xl font-bold text-red-900">
            ${dineroCancelado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-red-600">Órdenes canceladas</p>
        </div>
      </div>

      {/* Tabla (Se mantiene igual, solo cambia el estilo de los badges si quieres) */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3 text-center">Cant. Órdenes</th>
              <th className="px-6 py-3 text-right">Valor Total</th>
              <th className="px-6 py-3 text-right">Prom. Días</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila) => (
              <tr key={fila.status} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                   {/* Badge mejorado visualmente */}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border
                    ${fila.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' : 
                      fila.status === 'entregado' ? 'bg-green-50 text-green-700 border-green-200' : 
                      'bg-blue-50 text-blue-700 border-blue-200'}
                  `}>
                    {fila.status}
                  </span>
                </td>
                <td className="px-6 py-4">{fila.descripcion_estado}</td>
                <td className="px-6 py-4 text-center font-bold">
                  {fila.cantidad_ordenes}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  ${Number(fila.valor_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right">
                  {fila.dias_promedio} días
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
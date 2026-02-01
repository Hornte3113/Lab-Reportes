// src/app/page.tsx
import Link from 'next/link';

const reports = [
  { href: '/reports/clientes', title: 'Ranking de Clientes', desc: 'Top clientes por volumen de compra y frecuencia.' },
  { href: '/reports/estado-ordenes', title: 'Estado de Órdenes', desc: 'Resumen operativo de pedidos pendientes y completados.' },
  { href: '/reports/inventario', title: 'Rotación de Inventario', desc: 'Análisis de stock y velocidad de salida de productos.' },
  { href: '/reports/top-productos', title: 'Top Productos', desc: 'Los productos más exitosos por ingresos y volumen.' },
  { href: '/reports/ventas', title: 'Ventas por Categoría', desc: 'Métricas financieras agrupadas por categoría.' },
];

export default function Home() {
  return (
    <main className="p-12 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-center">Business Intelligence Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link key={report.href} href={report.href} className="block p-6 bg-white rounded-lg border shadow hover:bg-gray-50 transition">
            <h2 className="text-xl font-bold mb-2 text-blue-600">{report.title}</h2>
            <p className="text-gray-600">{report.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
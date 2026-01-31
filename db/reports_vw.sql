-- View 1: Ventas por categoria con CTE
--que devuelve: el analisis de ventas por categoria de productos
--Grain: Una fila por categoria
--Metricas: 
--- total_ordenes: cantidad de órdenes que incluyen productos
-- prouctos_

CREATE OR REPLACE VIEW view_ventas_por_categoria AS
WITH ventas_detalle AS (
    SELECT
    c.id as categoria_id,
    c.nombre as categoria,
    od.orden_id,
    od.cantidad,
    od.subtotal
    FROM categorias c
    INNER JOIN productos p ON c.id = p.categoria_id
    INNER JOIN orden_detalles od ON p.id = od.producto_id
    INNER JOIN ordenes o ON od.orden_id = o.id
    WHERE o.status !=  'cancelado'
),
totales AS (
    SELECT SUM(subtotal) as gran_total
    FROM ventas_detalle
)
SELECT 
vd.categoria_id,
vd.categoria,
COUNT(DISTINCT vd.orden_id) as total_ordenes,
SUM(vd.cantidad) as productos_vendidos ,
SUM(vd.subtotal) as ingresos_totales,
ROUND(AVG(vd.subtotal), 2) as ticket_promedio ,
ROUND(
    (SUM(vd.subtotal) / NULLIF(t.gran_total, 0) * 100) ,
    2
) as participacion_pct
FROM ventas_detalle vd
CROSS JOIN totales t 
GROUP BY vd.categoria_id, vd.categoria, t.gran_total
ORDER BY ingresos_totales DESC;


---view 2 Top de Prodcutos
--devuelve el ranking de de productos más vendidos

CREATE OR REPLACE VIEW view_top_productos AS
SELECT 
p.id as producto_id,
p.codigo,
p.nombre as producto,
c.nombre as categoria,
COALESCE(SUM(od.cantidad), 0) as  unidades_vendidas,
COALESCE(SUM(od.subtotal) 0) as ingresos_generados,
COUNT(DISTINCT od.orden_id) as ordenes_incluido,
p.precio as precio_actual,
p.stock as stock_actual,

ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(od.cantidad), 0) DESC) as ranking_ventas,
ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(od.subtotal), 0) DESC) as ranking_ingresos,
ROUND(
    100.0 * SUM(COALESCE(od.subtotal, 0)) OVER (ORDER BY COALESCE(SUM(od.subtotal), 0) DESC) / 
    NULLIF(SUM(COALESCE(od.subtotal, 0)) OVER (), 0), 2
) as pct_acumulado
FROM productos p 
INNER JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN orden_detalles od ON p.id = od.producto_id
LEFT JOIN ordenes o ON od.orden_id = o.id AND o.status !=  'cancelado'
GROUP BY p.id, p.codigo, p.nombre, c.nombre, p.precio, p.stock
HAVING COALESCE(SU(od.cantidad), 0) > 0
ORDER BY unidades_vendidas DESC;

-- VIEW 3

CREATE OR REPLACE VIEW view_clasificacion_clientes AS
SELECT 
    u.id as usuario_id,
    u.nombre as usuario,
    u.email,
    COUNT(DISTINCT o.id) as total_ordenes,
    COALESCE(SUM(DISTINCT o.total), 0) as gasto_total,
    ROUND(COALESCE(AVG(DISTINCT o.total), 0), 2) as gasto_promedio,
    COUNT(DISTINCT od.producto_id) as items_comprados,
    -- CASE para segmentación por gasto
    CASE 
        WHEN COALESCE(SUM(DISTINCT o.total), 0) >= 1000 THEN 'VIP'
        WHEN COALESCE(SUM(DISTINCT o.total), 0) >= 500  THEN 'Premium'
        WHEN COALESCE(SUM(DISTINCT o.total), 0) >= 100  THEN 'Regular'
        ELSE 'Nuevo'
    END as segmento_cliente,
    -- CASE para estado de actividad por frecuencia
    CASE 
        WHEN COUNT(DISTINCT o.id) >= 3 THEN 'Muy Activo'
        WHEN COUNT(DISTINCT o.id) >= 2 THEN 'Activo'
        WHEN COUNT(DISTINCT o.id) = 1  THEN 'Ocasional'
        ELSE 'Sin Compras'
    END as estado_actividad,
    MAX(o.created_at) as ultima_compra
FROM usuarios u
LEFT JOIN ordenes o ON u.id = o.usuario_id AND o.status != 'cancelado'
LEFT JOIN orden_detalles od ON o.id = od.orden_id
WHERE u.activo = TRUE
GROUP BY u.id, u.nombre, u.email
HAVING COUNT(DISTINCT o.id) > 0
ORDER BY gasto_total DESC;

--view 4 estado de ordenes con COALESCE  Y CASE
CREATE OR REPLACE VIEW view_estado_ordenes AS
SELECT
o.status,
COUNT(o.id) as cantidad_ordenes,
COALESCE(SUM(o.total), 0) as valor_total,
ROUND(COALESCE(AVG(o.total), 0), 2) as valor_promedio,
ROUND(COALESCE(AVG((SELECT COUNT (*) FROM orden_detalles od2 WHERE od2.orden_id = o.id)),
0), 2) as items_promedio,
ROUND(COALESCE(AVG(EXTRACT(DAY FROM (NOW() - o.created_at))),
0), 1) as dias_promedio,
--usamos case para la prioridad de atencion

CASE 
WHEN o.status =  'pendiente' THEN 1
WHEN o.status =  'pagado' THEN 2
WHEN o.status =  'enviado' THEN 3
WHEN o.status =  'entregado' THEN 4
WHEN o.status =  'cancelado' THEN 5
ELSE 6
END as prioridad,
--case para la descripcion del estado
CASE
WHEN o.status =  'pendiente' THEN  'Requiere pago'
WHEN o.stataus =  'pagado' THEN  'Listo para envio'
WHEN o.stataus =  'enviado' THEN  'En transito' 
WHEN o.stataus =  'entregado' THEN  'Completado'
WHEN o.stataus =  'cancelado' THEN  'cancelado'
ELSE  'Desconocido'
END as descripcion_estado

FROM ordenes o

GROUP BY o.status
HAVING COUNT(o.id) > 0
ORDER BY prioridad;
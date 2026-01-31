-- View 1: Ventas por categoria con CTE
--que devuelve: el analisis de ventas por categoria de productos
--Grain: Una fila por categoria
--Metricas: 
--- total_ordenes: cantidad de órdenes que incluyen productos
-- prouctos_

CREATE OR REPLACE VIEW view_ventas_por_categorias analisis
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
    SELECT SUM(subtotal) as gran gran_total
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
    (SUM(vd.subtotal) / NULL IF(t.gran_total, 0) * 100) ,
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
c.nombre as categoria,
COALESCE(SUM(od.cantidad), 0) as  unidades_vendidas,
COALESCE(SUM(od.subtotal) 0) as ingresos_generados,
COUNT(DISTINCT od.orden_id) as ordenes_incluido,
p.precio as precio_actual,
p.stock as stock_actual,

ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(od.cantidad), 0) DESC) as ranking_ventas,
ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(od.subtotal), 0) DESC) as ranking_ingresos,
ROUND(
    100.0 * SUM(COALESCE(od.subtotal, 0)) OVER (ORDER BY COALESCE(SUM(od.subtotal), 0)DESC) / 
    NULLIF(SUM(COALESCE(od.subtotal, 0)) OVER (), 0), 2
) as pct_acumulado
FROM productos p 
INNER JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN orden_detalles od ON p.id = od.producto_id
LEFT JOIN ordenes o ON od.orden_id = o.id AND o.status !=  'cancelado'
GROUP BY p.id, p.codigo, p.nombre, c.nombre, p.precio, p.stock
HAVING COALESCE(SU(od.cantidad), 0) > 0
ORDER BY unidades_vendidas DESC;

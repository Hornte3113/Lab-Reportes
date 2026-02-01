-- View 1: Ventas por categoría con CTE
-- Devuelve: Un resumen financiero por categoría de producto.
-- Grain: Una fila por categoría.
-- Métricas: Total de órdenes, unidades vendidas, ingresos, ticket promedio y % de participación.
-- GROUP BY: Necesario para agregar las métricas de órdenes y detalles por cada categoría.
-- VERIFY: SELECT * FROM view_ventas_por_categoria;
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


-- View 2: Top de Productos (Window Functions)
-- Devuelve: Ranking de productos basado en ventas e ingresos.
-- Grain: Una fila por producto activo con ventas.
-- Métricas: Unidades, ingresos, posición en ranking y % acumulado (Pareto).
-- HAVING: Filtra productos que no han tenido ninguna venta.
-- VERIFY: SELECT producto, ranking_ventas FROM view_top_productos WHERE ranking_ventas <= 5;
CREATE OR REPLACE VIEW view_top_productos AS
SELECT 
p.id as producto_id,
p.codigo,
p.nombre as producto,
c.nombre as categoria,
COALESCE(SUM(od.cantidad), 0) as  unidades_vendidas,
COALESCE(SUM(od.subtotal), 0) as ingresos_generados,
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
HAVING COALESCE(SUM(od.cantidad), 0) > 0
ORDER BY unidades_vendidas DESC;

-- View 3: Clasificación de Clientes (CASE)
-- Devuelve: Segmentación de clientes según su comportamiento de compra.
-- Grain: Una fila por cliente con compras.
-- Métricas: Total gastado, promedio por orden, segmento (VIP/Regular) y actividad.
-- VERIFY: SELECT usuario, segmento_cliente FROM view_clasificacion_clientes;
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
-- View 4: Estado de Órdenes
-- Métricas: Cantidad de órdenes, valor total, promedios de valor/items/días.
-- GROUP BY: Agrupa las órdenes por su estado actual para obtener totales operativos.
-- HAVING: Excluye estados que no tengan ninguna orden registrada.
-- Devuelve: Resumen operativo de los pedidos por estado.
-- Grain: Una fila por cada estado de orden (pendiente, pagado, etc.).
-- VERIFY: SELECT status, cantidad_ordenes FROM view_estado_ordenes;
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
WHEN o.status =  'pagado' THEN  'Listo para envio'
WHEN o.status =  'enviado' THEN  'En transito' 
WHEN o.status =  'entregado' THEN  'Completado'
WHEN o.status =  'cancelado' THEN  'cancelado'
ELSE  'Desconocido'
END as descripcion_estado

FROM ordenes o

GROUP BY o.status
HAVING COUNT(o.id) > 0
ORDER BY prioridad;


--VIEW 5 Inventario y Rotació
-- View 5: Inventario y Rotación
-- Devuelve: Análisis de stock y eficiencia de ventas.
-- Grain: Una fila por producto.
-- VERIFY: SELECT producto, nivel_stock, accion_recomendada FROM view_inventario_rotacion;
-- Métricas: Unidades vendidas, tasa de rotación, valor de inventario y ROI.
-- GROUP BY: Necesario para sumar las ventas (orden_detalles) por cada producto.
CREATE OR REPLACE VIEW view_inventario_rotacion AS
SELECT 
    p.id as producto_id,
    p.codigo,
    p.nombre as producto,
    c.nombre as categoria,
    p.stock as stock_actual,
    p.precio as precio_unitario,
    COALESCE(SUM(od.cantidad), 0) as unidades_vendidas,
    -- Tasa de rotación (ventas / stock, 0 si no hay stock)
    CASE 
        WHEN p.stock > 0 THEN ROUND(COALESCE(SUM(od.cantidad), 0)::NUMERIC / p.stock, 2)
        ELSE 0
    END as tasa_rotacion,
    ROUND(p.stock * p.precio, 2) as valor_inventario,
    COALESCE(SUM(od.subtotal), 0) as ingresos_generados,
    -- ROI del producto (ingresos / valor inventario)
    CASE 
        WHEN p.stock > 0 THEN 
            ROUND(
                COALESCE(SUM(od.subtotal), 0) / NULLIF(p.stock * p.precio, 0) * 100,
                2
            )
        ELSE 0
    END as roi_producto,
    -- CASE para nivel de stock
    CASE 
        WHEN p.stock = 0 THEN 'Sin Stock'
        WHEN p.stock < 10 THEN 'Crítico'
        WHEN p.stock < 50 THEN 'Bajo'
        WHEN p.stock < 100 THEN 'Normal'
        ELSE 'Alto'
    END as nivel_stock,
    -- CASE para acción recomendada basada en rotación y stock
    CASE 
        WHEN p.stock = 0 AND COALESCE(SUM(od.cantidad), 0) > 0 THEN 'Reabastecer Urgente'
        WHEN p.stock < 10 AND COALESCE(SUM(od.cantidad), 0) > 5 THEN 'Reabastecer'
        WHEN p.stock > 200 AND COALESCE(SUM(od.cantidad), 0) = 0 THEN 'Promocionar'
        WHEN p.stock > 100 AND COALESCE(SUM(od.cantidad), 0) < 5 THEN 'Revisar Demanda'
        ELSE 'Mantener'
    END as accion_recomendada,
    p.activo
FROM productos p
INNER JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN orden_detalles od ON p.id = od.producto_id
LEFT JOIN ordenes o ON od.orden_id = o.id AND o.status != 'cancelado'
GROUP BY p.id, p.codigo, p.nombre, c.nombre, p.stock, p.precio, p.activo
ORDER BY tasa_rotacion DESC;

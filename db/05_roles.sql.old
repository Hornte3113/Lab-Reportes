
-- ROLES

-- Objetivo: Crear un usuario con el principio de "menor privilegio"
-- Solo la app web usará este usuario, no el 'postgres'

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_client') THEN
    REASSIGN OWNED BY app_client TO postgres;
    DROP OWNED BY app_client;
    DROP ROLE app_client;
  END IF;
END
$$;


CREATE ROLE app_client WITH 
    LOGIN 
    PASSWORD 'secure_password' 
    NOSUPERUSER 
    INHERIT 
    NOCREATEDB 
    NOCREATEROLE 
    NOREPLICATION;

-- Permisos para la Conexión
-- Permitir conectarse a la base de datos
GRANT CONNECT ON DATABASE "postgres" TO app_client;

-- Permitir uso del esquema public (necesario para ver objetos)
GRANT USAGE ON SCHEMA public TO app_client;

--Permisos especificos de solo lectura a Views
-- Instrucción: "El usuario debe tener SELECT solo sobre las VIEWS"
GRANT SELECT ON view_ventas_por_categoria TO app_client;
GRANT SELECT ON view_top_productos        TO app_client;
GRANT SELECT ON view_clasificacion_clientes TO app_client;
GRANT SELECT ON view_estado_ordenes       TO app_client;
GRANT SELECT ON view_inventario_rotacion  TO app_client;

-- 5. Asegurar que NO tenga acceso a las tablas base
-- Por defecto un nuevo usuario no tiene acceso, pero revocamos permisos
-- públicos por seguridad extra (Hardening).
REVOKE ALL ON categorias, usuarios, productos, ordenes, orden_detalles FROM public;

REVOKE ALL ON categorias, usuarios, productos, ordenes, orden_detalles FROM app_client;

-- Verificación rápida
-- SELECT * FROM information_schema.role_table_grants WHERE grantee = 'app_client';
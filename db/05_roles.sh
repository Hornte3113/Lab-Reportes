#!/bin/bash
# Script para crear el rol app_client usando variables de entorno
# Se ejecuta automáticamente por docker-entrypoint-initdb.d

set -e

# Obtener credenciales desde variables de entorno
APP_USER="${APP_DB_USER:-app_client}"
APP_PASS="${APP_DB_PASSWORD:-secure_password}"

echo "Creando rol: $APP_USER"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- ROLES

    -- Objetivo: Crear un usuario con el principio de "menor privilegio"
    -- Solo la app web usará este usuario, no el 'postgres'

    DO \$\$
    BEGIN
      IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
        REASSIGN OWNED BY $APP_USER TO postgres;
        DROP OWNED BY $APP_USER;
        DROP ROLE $APP_USER;
      END IF;
    END
    \$\$;


    CREATE ROLE $APP_USER WITH
        LOGIN
        PASSWORD '$APP_PASS'
        NOSUPERUSER
        INHERIT
        NOCREATEDB
        NOCREATEROLE
        NOREPLICATION;

    -- Permisos para la Conexión
    -- Permitir conectarse a la base de datos
    GRANT CONNECT ON DATABASE "postgres" TO $APP_USER;

    -- Permitir uso del esquema public (necesario para ver objetos)
    GRANT USAGE ON SCHEMA public TO $APP_USER;

    -- Permisos especificos de solo lectura a Views
    -- Instrucción: "El usuario debe tener SELECT solo sobre las VIEWS"
    GRANT SELECT ON view_ventas_por_categoria TO $APP_USER;
    GRANT SELECT ON view_top_productos        TO $APP_USER;
    GRANT SELECT ON view_clasificacion_clientes TO $APP_USER;
    GRANT SELECT ON view_estado_ordenes       TO $APP_USER;
    GRANT SELECT ON view_inventario_rotacion  TO $APP_USER;

    -- Asegurar que NO tenga acceso a las tablas base
    -- Por defecto un nuevo usuario no tiene acceso, pero revocamos permisos
    -- públicos por seguridad extra (Hardening).
    REVOKE ALL ON categorias, usuarios, productos, ordenes, orden_detalles FROM public;

    REVOKE ALL ON categorias, usuarios, productos, ordenes, orden_detalles FROM $APP_USER;

    -- Verificación rápida
    -- SELECT * FROM information_schema.role_table_grants WHERE grantee = '$APP_USER';
EOSQL

echo "Rol $APP_USER creado exitosamente"

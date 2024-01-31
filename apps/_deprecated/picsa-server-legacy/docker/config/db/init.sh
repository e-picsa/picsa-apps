#!/bin/bash
# set -e

# NOTE - this file should be saved in LF format not CLRF

# Debugging - print environment variables
# printenv

# Create parse db user and database on startup
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER $PARSE_DB_USER WITH PASSWORD '${PARSE_DB_PASSWORD}';
    CREATE DATABASE ${PARSE_DB_NAME};
    GRANT ALL PRIVILEGES ON DATABASE ${PARSE_DB_NAME} TO ${PARSE_DB_USER};
EOSQL


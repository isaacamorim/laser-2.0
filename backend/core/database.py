## backend/core/database.py

import os
import logging
import oracledb as cx_Oracle
from core.exceptions import DatabaseError

# ---------------------------------------------------------------------------
# Configuração via variáveis de ambiente
# ---------------------------------------------------------------------------
DB_USER = os.getenv("DB_USER", "SYSALL")
DB_PASS = os.getenv("DB_PASS", "LEGEND")
DB_HOST = os.getenv("DB_HOST", "10.42.92.200")
DB_PORT = os.getenv("DB_PORT", "1521")
DB_SERVICE = os.getenv("DB_SERVICE", "ORCL")

# ---------------------------------------------------------------------------
# Detecta modo thick (Oracle Client instalado) ou thin
# ---------------------------------------------------------------------------
try:
    cx_Oracle.init_oracle_client()
    THICK_MODE = True
    logging.info("Modo thick ativado (Oracle Client encontrado).")
except cx_Oracle.DatabaseError:
    THICK_MODE = False
    logging.info("Oracle Client não encontrado, usando modo thin.")


# ---------------------------------------------------------------------------
# Função pública de conexão — usada em todo o projeto
# ---------------------------------------------------------------------------
def get_connection():
    """Retorna uma conexão com o banco de dados Oracle."""
    try:
        logging.debug(
            "Tentando conectar ao Oracle: %s@%s:%s/%s",
            DB_USER,
            DB_HOST,
            DB_PORT,
            DB_SERVICE,
        )
        dsn = cx_Oracle.makedsn(DB_HOST, int(DB_PORT), service_name=DB_SERVICE)
        conn = cx_Oracle.connect(user=DB_USER, password=DB_PASS, dsn=dsn)
        logging.info("Conexão com o Oracle estabelecida com sucesso.")
        return conn
    except cx_Oracle.Error as e:
        logging.error("Erro ao conectar ao Oracle: %s", e)
        raise DatabaseError(f"Falha ao conectar ao banco de dados: {e}")


# ---------------------------------------------------------------------------
# Teste direto do módulo
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    try:
        conn = get_connection()
        print("Conexão bem-sucedida!")
        conn.close()
    except Exception as e:
        print(f"Falha na conexão: {e}")

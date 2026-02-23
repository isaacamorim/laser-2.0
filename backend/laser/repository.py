## backend/modules/laser/repository.py

from datetime import datetime
import oracledb as cx_Oracle
from core.database import get_connection
from core.exceptions import DatabaseError, ConflictError


SEQUENCING_QUERY = """
    SELECT
        v.CODIOF   AS SOC_CODIOF,
        v.EMPRESA  AS SOC_EMPRESA,
        v.CODSEQ   AS SOC_CODSEQ,

        i.SOC_COLABID,
        i.SOC_SEQUEN,

        c.JLB_CODERP,
        c.JLB_NOMECB,

        p.JRO_PROERP,
        p.JRO_DESCRI,
        p.JRO_UNIMED,

        o.JOF_QTPROG AS QUANTIDADE_PROGRAMADA,
        SUM(l.JFL_QTREAL) AS QUANTIDADE_REALIZADA,

        pc.JPC_DESENHO_ENG

    FROM ALJ_V_OF_COM_SALDO v

    JOIN I_SEQ_OF_COLAB i
        ON i.SOC_CODIOF  = v.CODIOF
       AND i.SOC_EMPRESA = v.EMPRESA
       AND i.SOC_CODSEQ  = v.CODSEQ
       AND i.SOC_DATA_EXCLUSAO IS NULL

    JOIN J_COLAB c
        ON c.JLB_COLABID = i.SOC_COLABID

    JOIN J_OF o
        ON o.JOF_CODIOF = v.CODIOF
       AND o.JOF_EMPRESA = v.EMPRESA
       AND o.JOF_DATA_EXCLUSAO IS NULL
       AND o.JOF_DTENCE IS NULL

    JOIN J_PRODUTO p
        ON p.JRO_PROID = o.JOF_PROID

    LEFT JOIN J_PRODUTO_COMPLEMENTO pc
        ON pc.JPC_PROID = o.JOF_PROID

    LEFT JOIN J_OFLANC l
        ON l.JFL_CODIOF = v.CODIOF
       AND l.JFL_CODSEQ = v.CODSEQ
       AND l.JFL_EMPRESA = v.EMPRESA
       AND l.JFL_DATA_EXCLUSAO IS NULL

    WHERE c.JLB_CODERP = :operator_code

    GROUP BY
        v.CODIOF, v.EMPRESA, v.CODSEQ,
        i.SOC_COLABID, i.SOC_SEQUEN,
        c.JLB_CODERP, c.JLB_NOMECB,
        p.JRO_PROERP, p.JRO_DESCRI, p.JRO_UNIMED,
        o.JOF_QTPROG, pc.JPC_DESENHO_ENG

    ORDER BY v.EMPRESA, i.SOC_SEQUEN
"""


def fetch_sequencing(operator_code: str) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(SEQUENCING_QUERY, operator_code=operator_code)
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except cx_Oracle.Error as e:
        raise DatabaseError(f"Erro Oracle ao buscar sequenciamento: {e}")
    finally:
        cursor.close()
        conn.close()


def fetch_open_apontamento(operator_code: str, empresa_id: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT SOF_APONTAOFID, SOF_CODIOF, SOF_DTINIC, SOF_OPERAC
            FROM S_APONTAMENTO_OF
            WHERE SOF_OPERAD = :operator
              AND SOF_EMPRESA = :empresa
              AND SOF_DTAFIM IS NULL
              AND SOF_DATA_EXCLUSAO IS NULL
            """,
            {"operator": operator_code, "empresa": empresa_id},
        )
        row = cursor.fetchone()
        if row:
            return {
                "apontamento_id": row[0],
                "of_id": row[1],
                "inicio": row[2],
                "operacao": row[3],
            }
        return None
    finally:
        cursor.close()
        conn.close()


def insert_apontamento(
    of_numero: str,
    operador_codigo: str,
    dt_inicio: datetime,
    dt_afim: datetime,
    soc_codseq: str,
    quantidade_realizada: int,
    soc_empresa: str,
) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO S_APONTAMENTO_OF
                (SOF_CODIOF, SOF_OPERAD, SOF_DTINIC, SOF_DTAFIM,
                 SOF_OPERAC, SOF_QNTBOA, SOF_EMPRESA, SOF_DATCAD)
            VALUES
                (:of_numero, :operador_codigo, :dt_inicio, :dt_afim,
                 :soc_codseq, :quantidade_realizada, :soc_empresa, SYSDATE)
            """,
            of_numero=of_numero,
            operador_codigo=operador_codigo,
            dt_inicio=dt_inicio,
            dt_afim=dt_afim,
            soc_codseq=soc_codseq,
            quantidade_realizada=quantidade_realizada,
            soc_empresa=soc_empresa,
        )
        conn.commit()
    except cx_Oracle.Error as e:
        conn.rollback()
        raise DatabaseError(f"Erro Oracle ao registrar apontamento: {e}")
    finally:
        cursor.close()
        conn.close()


def insert_apontamento_start(
    of_id: str, operator_code: str, empresa_id: str, operac: int = 1
) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        new_id = cursor.var(int)
        cursor.execute(
            """
            INSERT INTO S_APONTAMENTO_OF
            (SOF_CODIOF, SOF_OPERAD, SOF_DTINIC, SOF_STATUS,
             SOF_EMPRESA, SOF_OPERAC, SOF_CODTUR, SOF_DATCAD)
            VALUES
            (:of_id, :operator, SYSDATE, 'A',
             :empresa, :operac, 1, SYSDATE)
            RETURNING SOF_APONTAOFID INTO :new_id
            """,
            {
                "of_id": of_id,
                "operator": operator_code,
                "empresa": empresa_id,
                "operac": operac,
                "new_id": new_id,
            },
        )
        conn.commit()
        return new_id.getvalue()[0]
    except cx_Oracle.Error as e:
        conn.rollback()
        raise DatabaseError(f"Erro Oracle ao iniciar apontamento: {e}")
    finally:
        cursor.close()
        conn.close()


def update_apontamento_pause(apontamento_id: int) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE S_APONTAMENTO_OF
            SET SOF_DTAFIM = SYSDATE
            WHERE SOF_APONTAOFID = :id
            """,
            {"id": apontamento_id},
        )
        conn.commit()
    except cx_Oracle.Error as e:
        conn.rollback()
        raise DatabaseError(f"Erro Oracle ao pausar apontamento: {e}")
    finally:
        cursor.close()
        conn.close()


def update_apontamento_finish(apontamento_id: int, quantidade: int) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE S_APONTAMENTO_OF
            SET SOF_DTAFIM = SYSDATE,
                SOF_QNTBOA = :qtd,
                SOF_STATUS = 'C'
            WHERE SOF_APONTAOFID = :id
            """,
            {"id": apontamento_id, "qtd": quantidade},
        )
        conn.commit()
    except cx_Oracle.Error as e:
        conn.rollback()
        raise DatabaseError(f"Erro Oracle ao finalizar apontamento: {e}")
    finally:
        cursor.close()
        conn.close()


def fetch_apontamentos_by_of(of_id: str) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT
                SOF_APONTAOFID,
                SOF_CODIOF,
                SOF_OPERAD,
                TO_CHAR(SOF_DTINIC, 'DD/MM/YYYY HH24:MI:SS') AS SOF_DTINIC,
                TO_CHAR(SOF_DTAFIM, 'DD/MM/YYYY HH24:MI:SS') AS SOF_DTAFIM,
                SOF_QNTBOA,
                SOF_ERROINTEGRA
            FROM S_APONTAMENTO_OF
            WHERE SOF_CODIOF = :of_id
              AND SOF_DATA_EXCLUSAO IS NULL
            ORDER BY SOF_DTINIC DESC
            """,
            {"of_id": of_id},
        )
        rows = cursor.fetchall()
        return [
            {
                "SOF_APONTAOFID": r[0],
                "SOF_CODIOF": r[1],
                "SOF_OPERAD": r[2],
                "SOF_DTINIC": r[3],
                "SOF_DTAFIM": r[4],
                "SOF_QNTBOA": r[5],
                "SOF_ERROINTEGRA": r[6],
            }
            for r in rows
        ]
    except cx_Oracle.Error as e:
        raise DatabaseError(f"Erro Oracle ao listar apontamentos: {e}")
    finally:
        cursor.close()
        conn.close()


def fetch_of_details(of_id: str, codseq: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                JRF_CODMAQ,
                JRF_CODSEQ,
                JRF_CODCNP,
                JRF_TMPMAQ,
                JRF_PROHOR
            FROM J_ROTOF
            WHERE JRF_CODIOF = :of_id
              AND JRF_CODSEQ = :codseq
            """,
            {"of_id": of_id, "codseq": codseq},
        )

        row = cursor.fetchone()

        if not row:
            return None

        return {
            "maquina": row[0],
            "operacao": row[1],
            "np": row[2],
            "tempo_maquina": row[3],
            "producao_por_hora": row[4],
        }

    finally:
        cursor.close()
        conn.close()


def fetch_of_materials(of_id: str) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                c.JFC_CODPRO,
                p.JRO_DESCRI,
                c.JFC_LOCEST
            FROM J_OFCONS c
            LEFT JOIN J_PRODUTO p
                ON p.JRO_PROERP = c.JFC_CODPRO
            WHERE c.JFC_CODIOF = :of_id
            """,
            {"of_id": of_id},
        )

        rows = cursor.fetchall()

        return [
            {
                "codigo": r[0],
                "descricao": r[1],
                "estoque": r[2],
            }
            for r in rows
        ]

    finally:
        cursor.close()
        conn.close()

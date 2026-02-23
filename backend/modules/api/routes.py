## backend/modules/api/routes.py

from flask import Blueprint, jsonify, request, abort
from flask_login import current_user
from core.database import get_connection

api_bp = Blueprint("api_bp", __name__, url_prefix="/api")


# ---------------------------------------------------------------------------
# Middleware — protege /api/laser/* com verificação de permissão
# ---------------------------------------------------------------------------
@api_bp.before_request
def check_permissions():
    if request.path.startswith("/api/laser"):
        if not current_user.has_permission("LASER_ACCESS"):
            abort(403, "Acesso não autorizado ao módulo laser")


# ---------------------------------------------------------------------------
# GET /api/laser/sequenciamento  (rota legada — mantida por compatibilidade)
# ---------------------------------------------------------------------------
@api_bp.route("/laser/sequenciamento", methods=["GET"])
def get_sequenciamento():
    operator = request.args.get("operator")
    if not operator:
        return jsonify({"success": False, "error": "Operador não especificado"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                OF_NUMERO,
                SEQUENCIA,
                QUANTIDADE,
                COD_PRODUTO,
                DESCRICAO_PRODUTO,
                CAMINHO_STEP
            FROM VW_SEQ_LASER
            WHERE SOC_COLABID = :id
              AND CAMINHO_STEP IS NOT NULL
            """,
            {"id": operator},
        )

        jobs = []
        for of_num, seq, qty, prod, desc, step in cursor:
            if not step.lower().endswith(".step"):
                step = f"{step}.step"
            jobs.append(
                {
                    "of": of_num,
                    "sequencia": seq,
                    "quantidade": qty,
                    "produto": prod,
                    "descricao": desc,
                    "stepPath": step,
                }
            )

        cursor.close()
        conn.close()
        return jsonify({"success": True, "jobs": jobs})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /api/laser/complete
# ---------------------------------------------------------------------------
@api_bp.route("/laser/complete", methods=["POST"])
def complete_job():
    if "pdf" not in request.files:
        return jsonify({"success": False, "error": "PDF não enviado"}), 400

    file = request.files["pdf"]
    try:
        # TODO: implementar process_file_upload e salvar apontamento
        result = process_file_upload(file)  # noqa: F821
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# GET /api/operadores/<codigo>
# ---------------------------------------------------------------------------
@api_bp.route("/operadores/<codigo>", methods=["GET"])
def get_operador(codigo):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT CLB_CODIGO, CLB_NOMECB
            FROM F_COLAB
            WHERE CLB_CODIGO = :codigo
            """,
            {"codigo": codigo},
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({"success": False, "error": "Operador não encontrado"}), 404

        return jsonify({"success": True, "codigo": row[0], "nome": row[1]})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# GET /api/laser/jobs
# ---------------------------------------------------------------------------
@api_bp.route("/laser/jobs", methods=["GET"])
def get_jobs():
    operator = request.args.get("operator")
    if not operator:
        return jsonify({"success": False, "error": "Operador não especificado"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT *
            FROM VW_APONTAMENTO_LASER
            WHERE OPERADOR = :operator
            ORDER BY DATA_LANCAMENTO DESC
            """,
            {"operator": operator},
        )
        cols = [col[0].lower() for col in cursor.description]
        jobs = [dict(zip(cols, row)) for row in cursor]
        cursor.close()
        conn.close()
        return jsonify({"success": True, "jobs": jobs})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

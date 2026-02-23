## backend/modules/laser?routes.import pymysql

from flask import Blueprint, request, jsonify, send_file
from core.exceptions import AppError
from laser import service
from laser import schemas
from .service import get_of_full_details
from core.exceptions import NotFoundError
from laser.service import get_of_details


laser_bp = Blueprint("laser_bp", __name__, url_prefix="/api/laser")


def _error_response(e: AppError):
    return jsonify({"success": False, "error": e.message}), e.status_code


# ---------------------------------------------------------------------------
# GET /api/laser/sequencing_v2
# ---------------------------------------------------------------------------
@laser_bp.route("/sequencing_v2", methods=["GET"])
def get_sequencing_v2():
    try:
        operator_code = schemas.validate_operator_code(request.args)
        jobs = service.get_sequencing(operator_code)
        return jsonify({"success": True, "jobs": jobs})
    except AppError as e:
        return _error_response(e)
    except Exception as e:
        return jsonify({"success": False, "error": f"Erro inesperado: {e}"}), 500


# ---------------------------------------------------------------------------
# GET /api/laser/download_step
# ---------------------------------------------------------------------------
@laser_bp.route("/download_step", methods=["GET"])
def download_step_file():
    try:
        file_path = schemas.validate_file_path(request.args)
        path, name = service.get_step_file(file_path)
        return send_file(path, as_attachment=True, download_name=name)
    except AppError as e:
        return _error_response(e)
    except Exception as e:
        return jsonify({"success": False, "error": f"Erro no servidor: {e}"}), 500


# ---------------------------------------------------------------------------
# POST /api/laser/submit_apontamento
# ---------------------------------------------------------------------------
@laser_bp.route("/submit_apontamento", methods=["POST"])
def submit_apontamento():
    try:
        data = schemas.validate_submit_apontamento(request.get_json() or {})
        service.submit_apontamento(data)
        return jsonify(
            {"success": True, "message": "Apontamento registrado com sucesso!"}
        )
    except AppError as e:
        return _error_response(e)
    except ValueError as ve:
        return jsonify({"success": False, "error": f"Formato inválido: {ve}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Erro inesperado: {e}"}), 500


# ---------------------------------------------------------------------------
# POST /api/laser/apontamento/start
# ---------------------------------------------------------------------------
@laser_bp.route("/apontamento/start", methods=["POST"])
def start_apontamento():
    try:
        data = schemas.validate_start_apontamento(request.get_json() or {})
        apontamento_id = service.start_apontamento(data)
        return jsonify({"success": True, "apontamento_id": apontamento_id})
    except AppError as e:
        # ConflictError (409) retorna dados extras
        if e.status_code == 409:
            return (
                jsonify(
                    {
                        "success": False,
                        "code": "APONTAMENTO_ABERTO",
                        "message": e.message,
                    }
                ),
                409,
            )
        return _error_response(e)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /api/laser/apontamento/pause
# ---------------------------------------------------------------------------
@laser_bp.route("/apontamento/pause", methods=["POST"])
def pause_apontamento():
    try:
        apontamento_id = schemas.validate_pause_apontamento(request.get_json() or {})
        service.pause_apontamento(apontamento_id)
        return jsonify({"success": True})
    except AppError as e:
        return _error_response(e)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /api/laser/apontamento/finish
# ---------------------------------------------------------------------------
@laser_bp.route("/apontamento/finish", methods=["POST"])
def finish_apontamento():
    try:
        apontamento_id, quantidade = schemas.validate_finish_apontamento(
            request.get_json() or {}
        )
        service.finish_apontamento(apontamento_id, quantidade)
        return jsonify({"success": True})
    except AppError as e:
        return _error_response(e)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# GET /api/laser/apontamento/list/<of_id>
# ---------------------------------------------------------------------------
@laser_bp.route("/apontamento/list/<string:of_id>", methods=["GET"])
def list_apontamentos(of_id: str):
    try:
        apontamentos = service.list_apontamentos(of_id)
        return jsonify(
            {"success": True, "apontamentos": apontamentos, "total": len(apontamentos)}
        )
    except AppError as e:
        return _error_response(e)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /api/laser/apontamento/confirm_batch
# ---------------------------------------------------------------------------
@laser_bp.route("/apontamento/confirm_batch", methods=["POST"])
def confirm_batch():
    try:
        data = schemas.validate_confirm_batch(request.get_json() or {})
        processed = service.confirm_batch(data)
        return jsonify(
            {
                "success": True,
                "message": f"{processed} apontamentos registrados com sucesso!",
            }
        )
    except AppError as e:
        return _error_response(e)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# --------------------------------------------------------------------------
# itens da OF
# ---------------------------------------------------------------------------
@laser_bp.route("/of/<string:of_id>/details", methods=["GET"])
def get_of_details_route(of_id):

    empresa = request.args.get("empresa")
    codseq = request.args.get("codseq")

    if not empresa or not codseq:
        return (
            jsonify({"success": False, "error": "empresa e codseq são obrigatórios"}),
            400,
        )

    try:
        data = get_of_details(of_id=of_id, empresa=empresa, codseq=codseq)

        return jsonify({"success": True, "data": data})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

## backend/modules/laser/service.py


import os
from shared.utils import calc_end_datetime
from core.exceptions import ConflictError, ValidationError, NotFoundError
from laser import repository
from .repository import fetch_of_details, fetch_of_materials

def get_sequencing(operator_code: str) -> list[dict]:
    return repository.fetch_sequencing(operator_code)


def get_step_file(file_path: str):
    """Retorna (file_path, file_name) se o arquivo existir."""
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise NotFoundError("Arquivo .step não encontrado ou não é um arquivo válido")
    return file_path, os.path.basename(file_path)


def submit_apontamento(data: dict) -> None:
    dt_inicio, dt_afim = calc_end_datetime(data["data_inicio"], data["tempo_total_pdf"])
    repository.insert_apontamento(
        of_numero=data["of_numero"],
        operador_codigo=data["operador_codigo"],
        dt_inicio=dt_inicio,
        dt_afim=dt_afim,
        soc_codseq=data["soc_codseq"],
        quantidade_realizada=int(data["quantidade_realizada"]),
        soc_empresa=data["soc_empresa"],
    )


def start_apontamento(data: dict) -> int:
    open_ap = repository.fetch_open_apontamento(
        data["operator_code"], data["empresa_id"]
    )
    if open_ap:
        raise ConflictError("Já existe um apontamento em andamento para este operador.")

    return repository.insert_apontamento_start(
        of_id=data["of_id"],
        operator_code=data["operator_code"],
        empresa_id=data["empresa_id"],
        operac=data.get("operac", 1),
    )


def pause_apontamento(apontamento_id: int) -> None:
    repository.update_apontamento_pause(apontamento_id)


def finish_apontamento(apontamento_id: int, quantidade: int) -> None:
    repository.update_apontamento_finish(apontamento_id, quantidade)


def list_apontamentos(of_id: str) -> list[dict]:
    return repository.fetch_apontamentos_by_of(of_id)


def confirm_batch(data: dict) -> int:
    items = data.get("items", [])
    processed = 0

    for item in items:
        try:
            dt_inicio, dt_afim = calc_end_datetime(
                item["start_time"], item["total_time"]
            )
            repository.insert_apontamento(
                of_numero=data["apontamento_id"],
                operador_codigo=data["operator_code"],
                dt_inicio=dt_inicio,
                dt_afim=dt_afim,
                soc_codseq=data["soc_codseq"],
                quantidade_realizada=int(item.get("qtd_apontar", 0)),
                soc_empresa=data["soc_empresa"],
            )
            processed += 1
        except Exception as e:
            # Loga e continua — item inválido não aborta o lote
            print(f"[confirm_batch] Erro no item {item}: {e}")

    return processed


def get_of_full_details(of_id: str, empresa: str, codseq: str) -> dict:
    details = fetch_of_details(of_id, empresa, codseq)

    if not details:
        raise NotFoundError("OF não encontrada ou sem dados de operação.")

    materials = fetch_of_materials(of_id)

    return {
        "of_id": of_id,
        "empresa": empresa,
        **details,
        "materiais": materials,
    }


def get_of_details(of_id, empresa, codseq):

    details = fetch_of_details(of_id, codseq)

    if not details:
        return None

    materials = fetch_of_materials(of_id)

    return {**details, "materiais": materials}

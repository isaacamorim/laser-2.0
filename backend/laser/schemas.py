## backend/modules/laser/schemas


from core.exceptions import ValidationError


def validate_operator_code(data: dict) -> str:
    code = data.get("operator_code")
    if not code:
        raise ValidationError("Código do operador não fornecido")
    return code


def validate_file_path(data: dict) -> str:
    file_path = data.get("file_path")
    if not file_path:
        raise ValidationError("Caminho do arquivo não fornecido")
    if ".." in file_path:
        raise ValidationError("Caminho de arquivo inválido")
    return file_path


def validate_submit_apontamento(data: dict) -> dict:
    required_fields = [
        "sof_apontamentoid",
        "of_numero",
        "operador_codigo",
        "data_inicio",
        "tempo_total_pdf",
        "quantidade_realizada",
        "soc_codseq",
        "soc_empresa",
        "sof_errointegra",
    ]
    for field in required_fields:
        if field not in data or data[field] is None:
            raise ValidationError(f"Campo obrigatório ausente ou nulo: {field}")
    return data


def validate_start_apontamento(data: dict) -> dict:
    required = ["of_id", "empresa_id", "operator_code"]
    for field in required:
        if field not in data:
            raise ValidationError(f"Campo ausente: {field}")
    return data


def validate_pause_apontamento(data: dict) -> int:
    apontamento_id = data.get("apontamento_id")
    if not apontamento_id:
        raise ValidationError("ID do apontamento não informado")
    return apontamento_id


def validate_finish_apontamento(data: dict) -> tuple:
    apontamento_id = data.get("apontamento_id")
    quantidade = data.get("quantidade_boa")
    if not apontamento_id or quantidade is None:
        raise ValidationError("Dados obrigatórios ausentes")
    return apontamento_id, quantidade


def validate_confirm_batch(data: dict) -> dict:
    required = ["apontamento_id", "operator_code", "soc_empresa", "soc_codseq"]
    for field in required:
        if not data.get(field):
            raise ValidationError(f"Campo obrigatório ausente: {field}")
    return data

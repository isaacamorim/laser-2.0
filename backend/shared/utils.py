## backend/shared/utils.py

from datetime import datetime, timedelta


def parse_datetime(dt_str: str) -> datetime:
    """Converte string no formato 'YYYY-MM-DD HH:MM:SS' para datetime."""
    return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")


def parse_duration(duration_str: str) -> timedelta:
    """
    Converte string no formato 'HH:MM:SS.ffffff' para timedelta.
    Exemplo: '01:30:00.000000'
    """
    time_parts = duration_str.split(":")
    hours = int(time_parts[0])
    minutes = int(time_parts[1])
    seconds_micro = time_parts[2].split(".")
    seconds = int(seconds_micro[0])
    microseconds = int(seconds_micro[1]) * 1000 if len(seconds_micro) > 1 else 0

    return timedelta(
        hours=hours, minutes=minutes, seconds=seconds, microseconds=microseconds
    )


def calc_end_datetime(start_str: str, duration_str: str) -> tuple[datetime, datetime]:
    """
    Retorna (dt_inicio, dt_afim) a partir de strings de início e duração.
    """
    dt_inicio = parse_datetime(start_str)
    delta = parse_duration(duration_str)
    dt_afim = dt_inicio + delta
    return dt_inicio, dt_afim

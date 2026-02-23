## backend/core/exceptions.py


class AppError(Exception):
    """Base error para erros da aplicação."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ValidationError(AppError):
    def __init__(self, message: str):
        super().__init__(message, 400)


class NotFoundError(AppError):
    def __init__(self, message: str):
        super().__init__(message, 404)


class DatabaseError(AppError):
    def __init__(self, message: str):
        super().__init__(message, 500)


class ConflictError(AppError):
    def __init__(self, message: str):
        super().__init__(message, 409)

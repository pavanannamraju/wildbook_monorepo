from dataclasses import dataclass


@dataclass(frozen=True)
class AppError(Exception):
    status_code: int
    code: str
    message: str

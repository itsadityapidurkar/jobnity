import os
import shutil
import tempfile
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

def is_dir_writable(path: str) -> bool:
    try:
        test_file = os.path.join(path, f".write_test_{os.getpid()}")
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        return True
    except Exception:
        return False

# Detect Vercel / serverless environment or read-only filesystem
is_serverless = bool(
    os.environ.get("VERCEL") or 
    os.environ.get("VERCEL_ENV") or 
    os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or
    not is_dir_writable(".")
)

if is_serverless:
    temp_dir = tempfile.gettempdir()
    writable_upload_dir = os.path.join(temp_dir, "jobnity_uploads")
    writable_db_path = os.path.join(temp_dir, "jobnity.db")

    # Copy pre-seeded SQLite database to /tmp/jobnity.db if not present or empty
    candidate_dbs = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../jobnity.db")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../jobnity.db")),
        os.path.abspath(os.path.join(os.getcwd(), "jobnity.db")),
        os.path.abspath(os.path.join(os.getcwd(), "backend/jobnity.db")),
    ]

    if not os.path.exists(writable_db_path) or os.path.getsize(writable_db_path) == 0:
        for cand in candidate_dbs:
            if os.path.exists(cand) and os.path.getsize(cand) > 0:
                try:
                    shutil.copy2(cand, writable_db_path)
                    break
                except Exception:
                    pass

    default_db_url = f"sqlite:///{writable_db_path}"
    default_upload_dir = writable_upload_dir
else:
    default_db_url = "sqlite:///./jobnity.db"
    default_upload_dir = "./uploads"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jobnity API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "jobnity_dev_secret_key_change_in_production"
    
    # Database URL
    DATABASE_URL: str = default_db_url

    # Uploads
    UPLOAD_DIR: str = default_upload_dir
    MAX_UPLOAD_SIZE_MB: int = 10

    # Local LLM Integration (Qwen 2.5 via Ollama)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    # CORS - Allow all origins
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"
    )

settings = Settings()

# Ensure upload directory exists safely
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception:
    pass



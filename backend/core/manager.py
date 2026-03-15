import pickle
from pathlib import Path
from typing import Any


class ModelProvider:
    def __init__(self, artifacts_path: Path | None = None) -> None:
        if artifacts_path is None:
            # ✅ Ruta correcta: backend/azca/artifacts/
            artifacts_path = Path(__file__).parent.parent / "azca" / "artifacts"
        self.artifacts_path = artifacts_path
        self._cache: dict[str, Any] = {}

    def get_model(self, name: str) -> Any:
        if name in self._cache:
            return self._cache[name]
        
        # Cargar directamente el pickle (XGBoost/sklearn)
        try:
            model_path = self.artifacts_path / f"{name}.pkl"
            
            # Verificar que el archivo específico existe
            if not model_path.exists():
                available_models = list(self.artifacts_path.glob("*.pkl"))
                available_names = [m.stem for m in available_models]
                raise FileNotFoundError(
                    f"Modelo '{name}.pkl' no encontrado en {self.artifacts_path}. "
                    f"Modelos disponibles: {available_names}"
                )
            
            print(f"📦 Cargando modelo desde {model_path}")
            with open(model_path, "rb") as f:
                model = pickle.load(f)
            
            self._cache[name] = model
            print(f"✅ Modelo cargado correctamente: {type(model).__name__}")
            return model
        except Exception as e:
            print(f"❌ Error al cargar modelo: {e}")
            raise

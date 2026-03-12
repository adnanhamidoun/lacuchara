import pickle
from pathlib import Path
from typing import Any


class ModelProvider:
    def __init__(self, artifacts_path: Path | None = None) -> None:
        if artifacts_path is None:
            artifacts_path = Path(__file__).parent.parent / "artifacts"
        self.artifacts_path = artifacts_path
        self._cache: dict[str, Any] = {}

    def get_model(self, name: str) -> Any:
        if name in self._cache:
            return self._cache[name]
        
        # Cargar directamente el pickle (XGBoost/sklearn)
        try:
            # Intenta con el nombre específico
            model_path = self.artifacts_path / f"{name}.pkl"
            if not model_path.exists():
                # Si no existe, intenta buscar cualquier .pkl en el directorio
                pkl_files = list(self.artifacts_path.glob("*.pkl"))
                if pkl_files:
                    model_path = pkl_files[0]
                    print(f"📦 Usando {model_path.name}")
                else:
                    raise FileNotFoundError(f"No .pkl found in {self.artifacts_path}")
            
            print(f"📦 Cargando modelo desde {model_path}")
            with open(model_path, "rb") as f:
                model = pickle.load(f)
            
            self._cache[name] = model
            print(f"✅ Modelo cargado correctamente: {type(model).__name__}")
            return model
        except Exception as e:
            print(f"❌ Error al cargar modelo: {e}")
            raise

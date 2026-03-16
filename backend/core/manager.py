import json
import os
import pickle
import shutil
import tempfile
from pathlib import Path
from typing import Any

try:
    from azureml.core import Workspace, Model
    from azureml.core.authentication import ServicePrincipalAuthentication
    AZURE_ML_AVAILABLE = True
except ImportError:
    AZURE_ML_AVAILABLE = False


class ModelProvider:
    # Backward-compatible aliases: existing call sites can keep old local ids.
    DEFAULT_MODEL_REGISTRY_MAP = {
        "azca_demand_v1": "azca-services-model",
        "azca_menu_starter_v2": "azca-menus-model",
        "azca_menu_main_v2": "azca-menus-model",
        "azca_menu_dessert_v2": "azca-menus-model",
    }

    def __init__(
        self,
        artifacts_path: Path | None = None,
        prefer_azure: bool | None = None,
        model_registry_map: dict[str, str] | None = None,
    ) -> None:
        if artifacts_path is None:
            artifacts_path = self._default_artifacts_path()

        disable_azure = (
            os.getenv("AZCA_DISABLE_AZURE_ML_MODELS", "0").strip().lower()
            in {"1", "true", "yes", "on"}
        )

        self.artifacts_path = artifacts_path
        self.prefer_azure = (not disable_azure) if prefer_azure is None else prefer_azure
        self.model_registry_map = {
            **self.DEFAULT_MODEL_REGISTRY_MAP,
            **(model_registry_map or {}),
        }

        self._cache: dict[str, Any] = {}
        self._resolved_refs: dict[str, str] = {}
        self._workspace: Any | None = None
        self._workspace_bootstrap_error: Exception | None = None
        self._azure_warning_printed = False
        self._registered_artifact_cache: dict[str, Path] = {}
        self._registered_version_cache: dict[str, str] = {}
        
        # Initialize Azure ML workspace with service principal auth
        self.ws = None
        if AZURE_ML_AVAILABLE:
            try:
                # Load config
                config_path = Path(__file__).parent.parent.parent / ".azureml" / "config.json"
                if not config_path.exists():
                    print(f"⚠️ Azure ML config not found at {config_path}")
                    return
                
                with open(config_path, "r") as f:
                    config = json.load(f)
                
                # Check for service principal env vars
                tenant_id = os.getenv('AZURE_TENANT_ID')
                client_id = os.getenv('AZURE_CLIENT_ID')
                client_secret = os.getenv('AZURE_CLIENT_SECRET')
                
                if not all([tenant_id, client_id, client_secret]):
                    print("⚠️ Azure ML service principal not configured.")
                    print("Set environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET")
                    print("Falling back to local model loading.")
                    return
                
                # Authenticate with service principal
                auth = ServicePrincipalAuthentication(
                    tenant_id=tenant_id,
                    service_principal_id=client_id,
                    service_principal_password=client_secret
                )
                
                self.ws = Workspace(
                    subscription_id=config['subscription_id'],
                    resource_group=config['resource_group'],
                    workspace_name=config['workspace_name'],
                    auth=auth
                )
                print("✅ Azure ML workspace initialized with service principal")
                
            except Exception as e:
                print(f"❌ Error initializing Azure ML workspace: {e}")
                print("Falling back to local model loading.")

    @staticmethod
    def _default_artifacts_path() -> Path:
        base_path = Path(__file__).parent.parent
        azca_artifacts = base_path / "azca" / "artifacts"
        if azca_artifacts.exists():
            return azca_artifacts
        return base_path / "artifacts"

    @staticmethod
    def _tokenize(value: str) -> set[str]:
        return {
            token
            for token in value.replace("-", "_").lower().split("_")
            if token
        }

    @classmethod
    def _path_tokens(cls, path: Path) -> set[str]:
        tokens: set[str] = set()
        for part in path.parts:
            tokens.update(cls._tokenize(part))
        return tokens

    def _get_workspace(self) -> Any:
        if self._workspace is not None:
            return self._workspace

        # Reuse workspace already built with service principal in __init__
        if self.ws is not None:
            self._workspace = self.ws
            return self._workspace

        if self._workspace_bootstrap_error is not None:
            raise RuntimeError("Azure ML workspace no disponible") from self._workspace_bootstrap_error

        try:
            from azureml.core import Workspace
        except ImportError as exc:
            self._workspace_bootstrap_error = exc
            raise RuntimeError(
                "Falta dependencia 'azureml-core'. Instalala para cargar modelos desde Azure ML."
            ) from exc

        # Build service-principal auth if env vars are present (avoids browser login)
        auth = None
        tenant_id = os.getenv("AZURE_TENANT_ID")
        client_id = os.getenv("AZURE_CLIENT_ID")
        client_secret = os.getenv("AZURE_CLIENT_SECRET")
        if tenant_id and client_id and client_secret:
            try:
                from azureml.core.authentication import ServicePrincipalAuthentication
                auth = ServicePrincipalAuthentication(
                    tenant_id=tenant_id,
                    service_principal_id=client_id,
                    service_principal_password=client_secret,
                )
            except Exception:
                pass  # fall through to unauthenticated path

        subscription_id = os.getenv("AZUREML_SUBSCRIPTION_ID") or os.getenv("AML_SUBSCRIPTION_ID")
        resource_group = os.getenv("AZUREML_RESOURCE_GROUP") or os.getenv("AML_RESOURCE_GROUP")
        workspace_name = os.getenv("AZUREML_WORKSPACE_NAME") or os.getenv("AML_WORKSPACE_NAME")
        config_path = os.getenv("AZUREML_CONFIG_PATH") or os.getenv("AML_WORKSPACE_CONFIG_PATH")

        try:
            if subscription_id and resource_group and workspace_name:
                self._workspace = Workspace.get(
                    name=workspace_name,
                    subscription_id=subscription_id,
                    resource_group=resource_group,
                    auth=auth,
                )
            elif config_path:
                self._workspace = Workspace.from_config(path=config_path, auth=auth)
            else:
                self._workspace = Workspace.from_config(auth=auth)
        except Exception as exc:
            self._workspace_bootstrap_error = exc
            raise RuntimeError(
                "No se pudo inicializar Azure ML Workspace. "
                "Configura AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET "
                "y un config.json valido (AZUREML_CONFIG_PATH o .azureml/config.json)."
            ) from exc

        return self._workspace

    @staticmethod
    def _model_sort_key(model: Any) -> tuple[int, str]:
        version_text = str(getattr(model, "version", ""))
        numeric_version = int(version_text) if version_text.isdigit() else -1
        created_time = str(getattr(model, "created_time", ""))
        return numeric_version, created_time

    def _get_latest_registered_model(self, registered_name: str) -> tuple[str, Path]:
        if registered_name in self._registered_artifact_cache:
            version = self._registered_version_cache.get(registered_name, "unknown")
            return version, self._registered_artifact_cache[registered_name]

        try:
            from azureml.core.model import Model
        except ImportError as exc:
            raise RuntimeError(
                "Falta dependencia 'azureml-core'. Instalala para consultar modelos registrados."
            ) from exc

        workspace = self._get_workspace()
        models = Model.list(workspace=workspace, name=registered_name)
        if not models:
            raise FileNotFoundError(
                f"No se encontro el modelo registrado '{registered_name}' en Azure ML."
            )

        latest_model = max(models, key=self._model_sort_key)
        version = str(latest_model.version)

        download_root = (
            Path(tempfile.gettempdir())
            / "azca_aml_models"
            / workspace.name
            / registered_name
            / version
        )
        download_root.mkdir(parents=True, exist_ok=True)

        downloaded = Path(latest_model.download(target_dir=str(download_root), exist_ok=True))
        artifact_root = downloaded if downloaded.is_dir() else downloaded.parent

        self._registered_artifact_cache[registered_name] = artifact_root
        self._registered_version_cache[registered_name] = version

        return version, artifact_root

    def _resolve_pickle_from_artifacts(
        self,
        artifact_root: Path,
        logical_name: str,
        registered_name: str,
    ) -> Path:
        expected_filename = f"{logical_name}.pkl"
        pickles = sorted(artifact_root.rglob("*.pkl"))
        if not pickles:
            raise FileNotFoundError(
                f"No hay archivos .pkl en artefactos descargados para '{registered_name}' ({artifact_root})."
            )

        exact_match = next((p for p in pickles if p.name == expected_filename), None)
        if exact_match:
            return exact_match

        registered_match = next((p for p in pickles if p.name == f"{registered_name}.pkl"), None)
        if registered_match:
            return registered_match

        registered_tokens = self._tokenize(registered_name)
        if registered_tokens:
            path_matches = [
                candidate
                for candidate in pickles
                if registered_tokens.issubset(self._path_tokens(candidate))
            ]
            if len(path_matches) == 1:
                return path_matches[0]
            if path_matches:
                pickles = path_matches

        if len(pickles) == 1:
            return pickles[0]

        logical_tokens = self._tokenize(logical_name)
        scored_candidates: list[tuple[int, Path]] = []

        for candidate in pickles:
            score = len(logical_tokens.intersection(self._tokenize(candidate.stem)))
            if score > 0:
                scored_candidates.append((score, candidate))

        if scored_candidates:
            scored_candidates.sort(key=lambda item: (-item[0], item[1].name))
            return scored_candidates[0][1]

        model_named = [candidate for candidate in pickles if candidate.name.lower() == "model.pkl"]
        if len(model_named) == 1:
            return model_named[0]

        candidate_names = [path.name for path in pickles]
        raise FileNotFoundError(
            f"No se pudo resolver el .pkl para '{logical_name}' en '{registered_name}'. "
            f"Pickles disponibles: {candidate_names}"
        )

    def _load_model_from_azure(self, logical_name: str) -> Any:
        registered_name = self.model_registry_map.get(logical_name, logical_name)
        version, artifact_root = self._get_latest_registered_model(registered_name)

        model_path = self._resolve_pickle_from_artifacts(
            artifact_root=artifact_root,
            logical_name=logical_name,
            registered_name=registered_name,
        )

        print(
            f"Cargando modelo Azure ML '{registered_name}:{version}' desde {model_path}"
        )
        with open(model_path, "rb") as model_file:
            model = pickle.load(model_file)

        self._resolved_refs[logical_name] = f"{registered_name}:{version}"
        return model

    def _load_model_from_local_artifacts(self, name: str) -> Any:
        registered_name = self.model_registry_map.get(name, name)

        if not self.artifacts_path.exists():
            raise FileNotFoundError(
                f"Ruta de artifacts local no encontrada: {self.artifacts_path}"
            )

        model_path = self._resolve_pickle_from_artifacts(
            artifact_root=self.artifacts_path,
            logical_name=name,
            registered_name=registered_name,
        )

        print(f"Cargando modelo local desde {model_path}")
        with open(model_path, "rb") as model_file:
            model = pickle.load(model_file)

        self._resolved_refs[name] = model_path.name
        return model

    def download_model_to_artifacts(
        self,
        registered_name: str,
        dest_pkl_path: Path | None = None,
    ) -> Path:
        """
        Download the latest version of *registered_name* from Azure ML, extract
        the .pkl file, and save it as ``{registered_name}.pkl`` in the artifacts
        folder (or at *dest_pkl_path* when supplied).  Returns the destination path.
        """
        if dest_pkl_path is None:
            dest_pkl_path = self.artifacts_path / f"{registered_name}.pkl"

        _, artifact_root = self._get_latest_registered_model(registered_name)
        src_pkl = self._resolve_pickle_from_artifacts(
            artifact_root=artifact_root,
            logical_name=registered_name,
            registered_name=registered_name,
        )
        dest_pkl_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_pkl, dest_pkl_path)

        # Invalidate in-memory caches so the next get_model() loads the new file
        for alias, reg in self.model_registry_map.items():
            if reg == registered_name:
                self._cache.pop(alias, None)
        self._cache.pop(registered_name, None)
        self._registered_artifact_cache.pop(registered_name, None)
        self._registered_version_cache.pop(registered_name, None)

        print(f"✅ Model '{registered_name}' saved to {dest_pkl_path}")
        return dest_pkl_path

    def ensure_models_in_artifacts(
        self,
        registered_names: list[str],
        force: bool = False,
    ) -> dict[str, Path]:
        """
        For each name in *registered_names*, download from Azure ML if the
        expected ``{name}.pkl`` is absent in the artifacts folder or *force* is
        True.  Returns a mapping registered_name → destination path for every
        successfully prepared model.
        """
        results: dict[str, Path] = {}
        for name in registered_names:
            dest = self.artifacts_path / f"{name}.pkl"
            if force or not dest.exists():
                action = "Refreshing" if dest.exists() else "Downloading"
                print(f"🔄 {action} model '{name}' from Azure ML…")
                try:
                    results[name] = self.download_model_to_artifacts(registered_name=name)
                except Exception as exc:
                    print(f"❌ Failed to download '{name}': {exc}")
                    if dest.exists():
                        print(f"   Keeping existing local copy.")
                        results[name] = dest
            else:
                print(f"✓ Model '{name}' already present at {dest}")
                results[name] = dest
        return results

    def get_model_reference(self, name: str) -> str:
        if name in self._resolved_refs:
            return self._resolved_refs[name]

        mapped_name = self.model_registry_map.get(name, name)
        version = self._registered_version_cache.get(mapped_name)
        if version:
            return f"{mapped_name}:{version}"
        return mapped_name

    def get_model(self, name: str) -> Any:
        if name in self._cache:
            return self._cache[name]

        azure_error: Exception | None = None

        # Try to load from Azure ML registry first (if enabled)
        if self.prefer_azure and AZURE_ML_AVAILABLE:
            try:
                loaded_model = self._load_model_from_azure(name)
                self._cache[name] = loaded_model
                print(f"✅ Model loaded from Azure ML: {type(loaded_model).__name__}")
                return loaded_model
            except Exception as e:
                azure_error = e
                print(f"❌ Error downloading model from Azure ML: {e}")
                print("Falling back to local loading")
        
        # Fallback to local loading
        try:
            model = self._load_model_from_local_artifacts(name)
            self._cache[name] = model
            print(f"Modelo cargado correctamente: {type(model).__name__}")
            return model
        except Exception as local_error:
            if azure_error is not None:
                raise RuntimeError(
                    "Error cargando modelo desde Azure ML y desde artifacts locales. "
                    f"Azure: {type(azure_error).__name__}: {azure_error}. "
                    f"Local: {type(local_error).__name__}: {local_error}"
                ) from local_error
            raise

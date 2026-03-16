import json
import os
from pathlib import Path
from typing import Any

import requests

from .manager import ModelProvider
from .pipeline import InferencePipeline


class CloudInferenceClient:
    TRUE_VALUES = {"1", "true", "yes", "on"}

    def __init__(
        self,
        enabled: bool,
        endpoint_url: str | None,
        api_key: str | None,
        bearer_token: str | None,
        deployment_name: str | None,
        timeout_seconds: float,
        model_endpoint_map: dict[str, str] | None = None,
        model_key_map: dict[str, str] | None = None,
        model_deployment_map: dict[str, str] | None = None,
    ) -> None:
        self.enabled = enabled
        self.endpoint_url = endpoint_url
        self.api_key = api_key
        self.bearer_token = bearer_token
        self.deployment_name = deployment_name
        self.timeout_seconds = timeout_seconds
        self.model_endpoint_map = model_endpoint_map or {}
        self.model_key_map = model_key_map or {}
        self.model_deployment_map = model_deployment_map or {}

    @staticmethod
    def _env_flag(name: str, default: bool = False) -> bool:
        value = os.getenv(name)
        if value is None:
            return default
        return value.strip().lower() in CloudInferenceClient.TRUE_VALUES

    @staticmethod
    def _read_json_env(name: str) -> dict[str, str]:
        raw = os.getenv(name)
        if not raw:
            return {}

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            print(f"⚠️ Variable {name} no es JSON valido. Se ignora.")
            return {}

        if not isinstance(parsed, dict):
            print(f"⚠️ Variable {name} debe ser un objeto JSON. Se ignora.")
            return {}

        normalized: dict[str, str] = {}
        for key, value in parsed.items():
            if key is None or value is None:
                continue
            normalized[str(key)] = str(value)
        return normalized

    @classmethod
    def from_env(cls) -> "CloudInferenceClient":
        model_endpoint_map = cls._read_json_env("AZCA_CLOUD_MODEL_ENDPOINTS")
        model_key_map = cls._read_json_env("AZCA_CLOUD_MODEL_KEYS")
        model_deployment_map = cls._read_json_env("AZCA_CLOUD_MODEL_DEPLOYMENTS")

        endpoint_url = os.getenv("AZCA_CLOUD_ENDPOINT_URL")
        api_key = os.getenv("AZCA_CLOUD_API_KEY")
        bearer_token = os.getenv("AZCA_CLOUD_BEARER_TOKEN")
        deployment_name = os.getenv("AZCA_CLOUD_DEPLOYMENT")
        timeout_raw = os.getenv("AZCA_CLOUD_TIMEOUT_SECONDS", "20")

        try:
            timeout_seconds = float(timeout_raw)
        except ValueError:
            timeout_seconds = 20.0

        requested = cls._env_flag("AZCA_CLOUD_INFERENCE_ENABLED", False)
        has_target = bool(endpoint_url or model_endpoint_map)
        enabled = requested and has_target

        if requested and not has_target:
            print(
                "⚠️ AZCA_CLOUD_INFERENCE_ENABLED=1, pero no hay endpoint definido "
                "(AZCA_CLOUD_ENDPOINT_URL o AZCA_CLOUD_MODEL_ENDPOINTS)."
            )

        return cls(
            enabled=enabled,
            endpoint_url=endpoint_url,
            api_key=api_key,
            bearer_token=bearer_token,
            deployment_name=deployment_name,
            timeout_seconds=timeout_seconds,
            model_endpoint_map=model_endpoint_map,
            model_key_map=model_key_map,
            model_deployment_map=model_deployment_map,
        )

    def _resolve_target(self, model_name: str) -> tuple[str, dict[str, str]]:
        url = self.model_endpoint_map.get(model_name) or self.endpoint_url
        if not url:
            raise RuntimeError(f"No hay endpoint cloud configurado para modelo '{model_name}'.")

        token = self.bearer_token
        key = self.model_key_map.get(model_name) or self.api_key
        deployment = self.model_deployment_map.get(model_name) or self.deployment_name

        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif key:
            headers["Authorization"] = f"Bearer {key}"

        if deployment:
            headers["azureml-model-deployment"] = deployment

        return url, headers

    @staticmethod
    def _build_split_payload(model_name: str, df_features: Any) -> dict:
        return {
            "input_data": {
                "columns": list(df_features.columns),
                "index": list(range(len(df_features))),
                "data": df_features.values.tolist(),
            },
            "model_name": model_name,
        }

    @staticmethod
    def _build_records_payload(model_name: str, df_features: Any) -> dict:
        return {
            "data": df_features.to_dict(orient="records"),
            "model_name": model_name,
        }

    def _invoke_raw(self, model_name: str, payload: dict) -> Any:
        url, headers = self._resolve_target(model_name)
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()

        text = response.text.strip()
        if not text:
            return {}

        try:
            return response.json()
        except ValueError:
            return text

    def invoke(self, model_name: str, df_features: Any) -> Any:
        payload_attempts = [
            self._build_split_payload(model_name, df_features),
            self._build_records_payload(model_name, df_features),
        ]

        last_error: Exception | None = None
        for payload in payload_attempts:
            try:
                return self._invoke_raw(model_name, payload)
            except Exception as exc:
                last_error = exc

        raise RuntimeError(
            f"Fallo invocacion cloud para '{model_name}' con formatos conocidos. "
            f"Ultimo error: {type(last_error).__name__}: {last_error}"
        ) from last_error

    @classmethod
    def _extract_base_prediction(cls, result: Any) -> Any:
        if isinstance(result, dict):
            for key in ("predictions", "prediction", "result", "results", "output", "outputs", "value"):
                if key in result:
                    return result[key]
        return result

    @classmethod
    def _extract_numeric_prediction(cls, result: Any) -> float:
        data = cls._extract_base_prediction(result)

        if isinstance(data, (int, float)):
            return float(data)

        if isinstance(data, list) and data:
            first = data[0]
            if isinstance(first, (int, float)):
                return float(first)
            if isinstance(first, list) and first and isinstance(first[0], (int, float)):
                return float(first[0])
            if isinstance(first, dict):
                for key in ("value", "prediction", "score", "result"):
                    value = first.get(key)
                    if isinstance(value, (int, float)):
                        return float(value)

        if isinstance(data, dict):
            for key in ("value", "prediction", "score", "result"):
                value = data.get(key)
                if isinstance(value, (int, float)):
                    return float(value)

        raise ValueError(f"Respuesta cloud no contiene prediccion numerica valida: {data}")

    @classmethod
    def _extract_ranked_predictions(cls, result: Any, top_k: int = 3) -> list[tuple[str, float]]:
        data = cls._extract_base_prediction(result)
        ranked: list[tuple[str, float]] = []

        if isinstance(data, dict):
            classes = data.get("classes")
            probabilities = data.get("probabilities")
            if isinstance(classes, list) and isinstance(probabilities, list) and len(classes) == len(probabilities):
                ranked = [
                    (str(label), float(score))
                    for label, score in zip(classes, probabilities)
                ]
            elif isinstance(probabilities, dict):
                ranked = [
                    (str(label), float(score))
                    for label, score in probabilities.items()
                ]

        if isinstance(data, list):
            for item in data:
                if isinstance(item, (list, tuple)) and len(item) >= 2:
                    ranked.append((str(item[0]), float(item[1])))
                    continue

                if isinstance(item, dict):
                    label = (
                        item.get("label")
                        or item.get("class")
                        or item.get("dish")
                        or item.get("dish_name")
                        or item.get("name")
                    )
                    score = item.get("score")
                    if score is None:
                        score = item.get("probability")
                    if score is None:
                        score = item.get("confidence")
                    if score is None:
                        score = item.get("value")

                    if label is not None and isinstance(score, (int, float)):
                        ranked.append((str(label), float(score)))

        if not ranked:
            raise ValueError(f"Respuesta cloud no contiene ranking utilizable: {data}")

        ranked.sort(key=lambda item: item[1], reverse=True)
        return ranked[:top_k]

    def predict_scalar(self, model_name: str, df_features: Any) -> int:
        result = self.invoke(model_name, df_features)
        return int(self._extract_numeric_prediction(result))

    def predict_top_k(self, model_name: str, df_features: Any, top_k: int = 3) -> list[tuple[str, float]]:
        result = self.invoke(model_name, df_features)
        return self._extract_ranked_predictions(result, top_k=top_k)


class PredictionEngine:
    def __init__(
        self,
        artifacts_path: Path | None = None,
        pipeline_config: dict | None = None,
    ) -> None:
        """
        Initialize prediction engine with model provider and inference pipeline.

        Args:
            artifacts_path: Path to artifacts directory (auto-detected if None)
            pipeline_config: Fixed fields config for InferencePipeline
        """
        self.cloud_client = CloudInferenceClient.from_env()
        self.cloud_only = CloudInferenceClient._env_flag("AZCA_CLOUD_ONLY", False)

        # prefer_azure=False: models are pre-downloaded to artifacts_path by the
        # startup downloader and refreshed monthly; avoid redundant Azure ML calls
        # during inference.
        self.model_provider = ModelProvider(artifacts_path, prefer_azure=False)
        self.pipeline = InferencePipeline(fixed_fields=pipeline_config)

    @staticmethod
    def _extract_service_model_columns(model: Any) -> list[str] | None:
        feature_names = getattr(model, "feature_names_in_", None)
        if feature_names is not None:
            cols = [str(col) for col in feature_names]
            if cols:
                return cols

        steps = getattr(model, "steps", None)
        if isinstance(steps, list):
            for _, step in steps:
                columns_mapping = getattr(step, "_columns_types_mapping", None)
                if isinstance(columns_mapping, dict) and columns_mapping:
                    return [str(col) for col in columns_mapping.keys()]

                step_feature_names = getattr(step, "feature_names_in_", None)
                if step_feature_names is not None:
                    cols = [str(col) for col in step_feature_names]
                    if cols:
                        return cols

        return None

    def get_model_reference(self, model_name: str) -> str:
        """Return the resolved model reference (e.g. azca-services-model:12)."""
        if self.cloud_client.enabled:
            return f"cloud:{model_name}"
        return self.model_provider.get_model_reference(model_name)

    def predict(self, model_name: str, data: dict) -> int:
        """
        Load model, build features, and return prediction.

        Args:
            model_name: Name of .pkl file in artifacts (without extension)
            data: Raw input dict (e.g., service_date, max_temp_c, precipitation_mm, etc.)

        Returns:
            Prediction value (services count)
        """
        cloud_df_features = self.pipeline.build_features(data)

        if self.cloud_client.enabled:
            try:
                print(f"☁️ Realizando prediccion cloud con modelo: {model_name}")
                prediction = self.cloud_client.predict_scalar(model_name, cloud_df_features)
                print(f"✅ Prediccion cloud exitosa: {prediction}")
                return prediction
            except Exception as cloud_error:
                if self.cloud_only:
                    raise RuntimeError(
                        "Cloud inference habilitado en modo estricto (AZCA_CLOUD_ONLY=1) y "
                        "la invocacion cloud fallo. No se permite fallback local."
                    ) from cloud_error
                print(f"⚠️ Error cloud, fallback a local: {type(cloud_error).__name__}: {cloud_error}")

        try:
            model = self.model_provider.get_model(model_name)
            expected_columns = self._extract_service_model_columns(model)
            df_features = self.pipeline.build_features(data, expected_columns=expected_columns)
            if expected_columns:
                print(f"🧩 Esquema de features servicios usado: {list(df_features.columns)}")

            print(f"🔮 Realizando predicción con modelo: {type(model).__name__}")
            prediction = model.predict(df_features)
            print(f"✅ Predicción exitosa: {prediction}")
            return int(prediction[0])
        except Exception as e:
            print(f"❌ Error en predicción: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def predict_menu(self, model_name: str, data: dict) -> list:
        """
        Load menu model (starters/mains/desserts), build features, and return TOP 3 with scores.

        Args:
            model_name: Name of .pkl file in artifacts (without extension)
            data: Raw input dict with exactly 8 features (restaurant_id, day_of_week, month, etc.)

        Returns:
            List of tuples [(dish_name, probability), ...] sorted by probability (descending). Top 3 minimum.

        Raises:
            Exception if model doesn't have predict_proba or returns invalid format
        """
        # Cloud endpoint contract may differ from local sklearn pickles.
        # Keep the default legacy payload shape for cloud calls.
        cloud_df_features = self.pipeline.build_menu_features(data)

        if self.cloud_client.enabled:
            try:
                print(f"☁️ Realizando prediccion TOP 3 cloud con modelo: {model_name}")
                top_3_dishes = self.cloud_client.predict_top_k(model_name, cloud_df_features, top_k=3)
                print(f"✅ Top 3 predicciones cloud exitosas: {top_3_dishes}")
                return top_3_dishes
            except Exception as cloud_error:
                if self.cloud_only:
                    raise RuntimeError(
                        "Cloud inference habilitado en modo estricto (AZCA_CLOUD_ONLY=1) y "
                        "la invocacion cloud fallo. No se permite fallback local."
                    ) from cloud_error
                print(f"⚠️ Error cloud, fallback a local: {type(cloud_error).__name__}: {cloud_error}")

        try:
            model = self.model_provider.get_model(model_name)
            print(f"🔮 Realizando predicción de top 3 con modelo: {type(model).__name__}")

            if not hasattr(model, "predict_proba"):
                raise AttributeError(
                    f"Modelo {model_name} no tiene predict_proba. Solo acepta modelos de clasificación."
                )

            expected_columns = getattr(model, "feature_names_in_", None)
            candidate_columns: list[list[str]] = []

            if expected_columns is not None:
                candidate_columns.append([str(col) for col in expected_columns])

            candidate_columns.extend(
                [
                    list(self.pipeline.MENU_COLUMNS),
                    list(self.pipeline.NUMERIC_MENU_COLUMNS),
                    list(self.pipeline.NUMERIC_MENU_COLUMNS_NO_DISH_ID),
                ]
            )

            unique_candidates: list[list[str]] = []
            seen: set[tuple[str, ...]] = set()
            for columns in candidate_columns:
                key = tuple(columns)
                if key in seen:
                    continue
                seen.add(key)
                unique_candidates.append(columns)

            probabilities = None
            used_columns: list[str] = []
            last_error: Exception | None = None

            for columns in unique_candidates:
                try:
                    df_features = self.pipeline.build_menu_features(data, expected_columns=columns)
                    probabilities = model.predict_proba(df_features)
                    used_columns = list(df_features.columns)
                    break
                except Exception as candidate_error:
                    last_error = candidate_error

            if probabilities is None:
                raise RuntimeError(
                    "No se pudo alinear el esquema de features del modelo de menu con el input recibido. "
                    f"Ultimo error: {type(last_error).__name__}: {last_error}"
                ) from last_error

            print(f"🧩 Esquema de features menu usado: {used_columns}")
            classes = model.classes_

            import pandas as pd
            if isinstance(probabilities, pd.DataFrame):
                probabilities = probabilities.values

            probs_row = probabilities[0]
            top_3_indices = (-probs_row).argsort()[:3]

            top_3_dishes = [
                (classes[idx], float(probs_row[idx]))
                for idx in top_3_indices
            ]

            print(f"✅ Top 3 predicciones exitosas: {top_3_dishes}")
            return top_3_dishes
        except Exception as e:
            print(f"❌ Error en predicción de menú: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def predict_unified_menu(self, model_name: str, data: dict) -> list:
        """
        Load unified menu model (AzcaMenuModel.pkl), build 15 features, and return TOP 3 with scores.

        Args:
            model_name: Name of .pkl file in artifacts (without extension) - typically "AzcaMenuModel"
            data: Raw input dict with exactly 15 features (course_type, prev_dish_id, etc.)

        Returns:
            List of tuples [(dish_name, probability), ...] sorted by probability (descending). Top 3 minimum.

        Raises:
            Exception if model doesn't have predict_proba or returns invalid format
        """
        try:
            print(f"\n🔍 INICIO predict_unified_menu() con modelo: {model_name}")

            print("🔨 Construyendo 15 features...")
            df_features = self.pipeline.build_unified_menu_features(data)
            print(f"✅ DataFrame con shape {df_features.shape} construido")

            if self.cloud_client.enabled:
                try:
                    print(f"☁️ Realizando prediccion TOP 3 cloud con modelo: {model_name}")
                    top_3_dishes = self.cloud_client.predict_top_k(model_name, df_features, top_k=3)
                    print(f"✅ Top 3 predicciones cloud exitosas: {top_3_dishes}")
                    print("✅ FIN predict_unified_menu()\n")
                    return top_3_dishes
                except Exception as cloud_error:
                    if self.cloud_only:
                        raise RuntimeError(
                            "Cloud inference habilitado en modo estricto (AZCA_CLOUD_ONLY=1) y "
                            "la invocacion cloud fallo. No se permite fallback local."
                        ) from cloud_error
                    print(f"⚠️ Error cloud, fallback a local: {type(cloud_error).__name__}: {cloud_error}")

            print(f"📦 Cargando modelo: {model_name}")
            model = self.model_provider.get_model(model_name)
            print(f"✅ Modelo cargado: {type(model).__name__}")

            print(f"🔮 Realizando predicción de top 3 con modelo unificado: {type(model).__name__}")

            if not hasattr(model, "predict_proba"):
                raise AttributeError(
                    f"Modelo {model_name} no tiene predict_proba. Solo acepta modelos de clasificación."
                )

            print("📊 Llamando a predict_proba()...")
            probabilities = model.predict_proba(df_features)
            classes = model.classes_
            print(
                f"✅ predict_proba() retornó resultado de tipo {type(probabilities).__name__} "
                f"con shape {probabilities.shape if hasattr(probabilities, 'shape') else 'N/A'}"
            )
            print(f"📝 Classes ({len(classes)} total): {classes[:5]}... (primeras 5)")

            import pandas as pd
            if isinstance(probabilities, pd.DataFrame):
                print("🔄 Convirtiendo probabilities de DataFrame a numpy array")
                probabilities = probabilities.values

            probs_row = probabilities[0]
            print(f"📊 Probabilidades (primeras 10): {probs_row[:10]}")
            top_3_indices = (-probs_row).argsort()[:3]
            print(f"✅ Top 3 indices: {top_3_indices}")

            top_3_dishes = [
                (classes[idx], float(probs_row[idx]))
                for idx in top_3_indices
            ]

            print(f"✅ Top 3 predicciones exitosas: {top_3_dishes}")
            print("✅ FIN predict_unified_menu()\n")
            return top_3_dishes
        except Exception as e:
            print(f"❌ Error en predicción de menú unificado: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

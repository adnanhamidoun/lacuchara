from pathlib import Path

from .manager import ModelProvider
from .pipeline import InferencePipeline


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
        self.model_provider = ModelProvider(artifacts_path)
        self.pipeline = InferencePipeline(fixed_fields=pipeline_config)

    def predict(self, model_name: str, data: dict) -> int:
        """
        Load model, build features, and return prediction.

        Args:
            model_name: Name of .pkl file in artifacts (without extension)
            data: Raw input dict (e.g., service_date, max_temp_c, precipitation_mm, etc.)

        Returns:
            Prediction value (services count)
        """
        try:
            # Load model from cache
            model = self.model_provider.get_model(model_name)

            # Build feature dataframe
            df_features = self.pipeline.build_features(data)

            # Predict
            print(f"🔮 Realizando predicción con modelo: {type(model).__name__}")
            prediction = model.predict(df_features)
            print(f"✅ Predicción exitosa: {prediction}")

            return int(prediction[0])
        except Exception as e:
            print(f"❌ Error en predicción: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

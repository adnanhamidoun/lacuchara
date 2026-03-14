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
        try:
            # Load model from cache
            model = self.model_provider.get_model(model_name)

            # Build feature dataframe with ONLY 8 features (no expansion)
            df_features = self.pipeline.build_menu_features(data)

            # Get top 3 predictions with probabilities
            print(f"🔮 Realizando predicción de top 3 con modelo: {type(model).__name__}")
            
            # Use predict_proba to get probabilities for all classes
            if not hasattr(model, 'predict_proba'):
                raise AttributeError(f"Modelo {model_name} no tiene predict_proba. Solo acepta modelos de clasificación.")
            
            probabilities = model.predict_proba(df_features)  # Shape: (1, n_classes) - puede ser DataFrame o array
            classes = model.classes_  # Class labels (dish names)
            
            # Convert DataFrame to numpy array if necessary
            import pandas as pd
            if isinstance(probabilities, pd.DataFrame):
                probabilities = probabilities.values
            
            # Get top 3 indices (descending order of probability)
            probs_row = probabilities[0]  # First (only) row
            top_3_indices = (-probs_row).argsort()[:3]
            
            # Build result: [(dish_name, score), ...]
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

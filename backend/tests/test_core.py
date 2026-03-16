import pytest
import pickle
from datetime import datetime
from pathlib import Path

from azca.core.manager import ModelProvider
from azca.core.pipeline import InferencePipeline
from azca.core.engine import PredictionEngine, CloudInferenceClient


class TestModelProvider:
    def test_model_provider_init(self):
        """Test ModelProvider initialization"""
        provider = ModelProvider()
        assert provider.artifacts_path is not None
        assert provider._cache == {}

    def test_model_provider_custom_path(self, tmp_path):
        """Test ModelProvider with custom path"""
        provider = ModelProvider(artifacts_path=tmp_path)
        assert provider.artifacts_path == tmp_path

    def test_model_provider_cache(self):
        """Test that ModelProvider caches models"""
        provider = ModelProvider()
        # First call should populate cache
        provider._cache["test_model"] = "cached_value"
        assert provider._cache["test_model"] == "cached_value"

    def test_load_local_generic_model_pickle(self, tmp_path):
        """Test local recursive resolve for model.pkl downloaded by Azure ML."""
        model_dir = tmp_path / "azca-menus-model" / "1"
        model_dir.mkdir(parents=True)
        payload = {"source": "generic-model"}

        with open(model_dir / "model.pkl", "wb") as model_file:
            pickle.dump(payload, model_file)

        provider = ModelProvider(artifacts_path=tmp_path, prefer_azure=False)
        model = provider.get_model("azca-menus-model")
        assert model == payload

    def test_load_local_generic_model_pickle_via_alias(self, tmp_path):
        """Test logical alias maps to registered-name folder with model.pkl."""
        model_dir = tmp_path / "azca-menus-model" / "2"
        model_dir.mkdir(parents=True)
        payload = {"source": "alias"}

        with open(model_dir / "model.pkl", "wb") as model_file:
            pickle.dump(payload, model_file)

        provider = ModelProvider(artifacts_path=tmp_path, prefer_azure=False)
        model = provider.get_model("azca_menu_starter_v2")
        assert model == payload


class TestInferencePipeline:
    def test_pipeline_init_defaults(self):
        """Test InferencePipeline with default config"""
        pipeline = InferencePipeline()
        assert pipeline.fixed_fields is not None
        assert pipeline.fixed_fields["restaurant_id"] == 1
        assert pipeline.fixed_fields["menu_price"] == 15.0

    def test_pipeline_init_custom(self):
        """Test InferencePipeline with custom config"""
        custom_config = {"restaurant_id": 101, "menu_price": 20.0}
        pipeline = InferencePipeline(fixed_fields=custom_config)
        assert pipeline.fixed_fields["restaurant_id"] == 101
        assert pipeline.fixed_fields["menu_price"] == 20.0

    def test_build_features_shape(self):
        """Test build_features returns correct shape"""
        pipeline = InferencePipeline()
        data = {
            "service_date": datetime(2026, 3, 15),
            "max_temp_c": 22.5,
        }
        df = pipeline.build_features(data)
        assert df.shape == (1, 24)
        assert list(df.columns) == pipeline.MODEL_COLUMNS

    def test_build_features_defaults(self):
        """Test build_features applies defaults correctly"""
        pipeline = InferencePipeline()
        data = {
            "service_date": datetime(2026, 3, 15),
            "max_temp_c": 22.5,
        }
        df = pipeline.build_features(data)
        assert df["precipitation_mm"].values[0] == 0
        assert df["is_stadium_event"].values[0] == False
        assert df["services_lag_7"].values[0] == 100

    def test_build_features_rain_peak(self):
        """Test rain peak detection (>10mm)"""
        pipeline = InferencePipeline()
        data = {
            "service_date": datetime(2026, 3, 15),
            "max_temp_c": 15.0,
            "precipitation_mm": 25,
        }
        df = pipeline.build_features(data)
        assert df["is_rain_service_peak"].values[0] == True

    def test_build_features_business_day(self):
        """Test business day detection (Mon=0, Fri=4)"""
        pipeline = InferencePipeline()
        # Monday
        data = {
            "service_date": datetime(2026, 3, 16),  # Monday
            "max_temp_c": 20.0,
        }
        df = pipeline.build_features(data)
        assert df["is_business_day"].values[0] == True

        # Saturday
        data["service_date"] = datetime(2026, 3, 14)  # Saturday
        df = pipeline.build_features(data)
        assert df["is_business_day"].values[0] == False


class TestPredictionEngine:
    def test_engine_init(self):
        """Test PredictionEngine initialization"""
        engine = PredictionEngine()
        assert engine.model_provider is not None
        assert engine.pipeline is not None

    def test_engine_init_custom_config(self, tmp_path):
        """Test PredictionEngine with custom config"""
        custom_config = {"restaurant_id": 50}
        engine = PredictionEngine(
            artifacts_path=tmp_path,
            pipeline_config=custom_config
        )
        assert engine.pipeline.fixed_fields["restaurant_id"] == 50


class TestCloudInferenceClient:
    def test_extract_numeric_prediction_from_list(self):
        value = CloudInferenceClient._extract_numeric_prediction({"predictions": [123.0]})
        assert value == 123.0

    def test_extract_numeric_prediction_from_dict(self):
        value = CloudInferenceClient._extract_numeric_prediction({"prediction": {"value": 87}})
        assert value == 87.0

    def test_extract_ranked_predictions_from_classes_probabilities(self):
        ranked = CloudInferenceClient._extract_ranked_predictions(
            {
                "classes": ["A", "B", "C"],
                "probabilities": [0.11, 0.87, 0.32],
            },
            top_k=2,
        )
        assert ranked == [("B", 0.87), ("C", 0.32)]

    def test_extract_ranked_predictions_from_list_of_dicts(self):
        ranked = CloudInferenceClient._extract_ranked_predictions(
            {
                "predictions": [
                    {"label": "Dish 1", "score": 0.20},
                    {"label": "Dish 2", "score": 0.93},
                    {"label": "Dish 3", "score": 0.55},
                ]
            },
            top_k=3,
        )
        assert ranked == [("Dish 2", 0.93), ("Dish 3", 0.55), ("Dish 1", 0.20)]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

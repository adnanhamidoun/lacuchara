# ML Training & Data

Machine learning models, training scripts, and datasets.

## 📁 Structure

```
backend/ml-training/
├── src/              # Training scripts (Python)
├── data/             # Training datasets (CSVs)
└── models/           # Trained models (PKL files)
```

### `src/` — Training Scripts
Python scripts for ML model training and data preparation.

**Dataset Preparation:**
- `clean_dataset.py` - Clean and standardize raw data
- `mezclar_datos.py` - Combine multiple data sources
- `juntar_columnas_menus.py` - Join columns for menu data
- `generador_faker_menus.py` - Generate synthetic menu data

**Feature Engineering:**
- `categorizacion_platos.py` - Categorize dishes
- `auditoria.py` - Data quality audits

**Model Training:**
- `entrenamiento_base.py` - Base model training
- `entrenar_v3.py` - Latest training pipeline (v3)
- `modelo_entrante.py` - Appetizer model training
- `cargar_ratings_sql.py` - Load ratings from database

**Data Management:**
- `subir_menus_historicos.py` - Upload historical menu data to SQL

### `data/` — Training Datasets
CSV files with training data and intermediate results.

**Raw Data:**
- `base_azca.csv` - Base restaurant menu data
- `automl_training_flat.csv` - Flattened data for AutoML

**Processed Data:**
- `dataset_entrenamiento_10anios_menus.csv` - 10-year menu training data
- `dataset_menus_final.csv` - Final processed menu dataset

**Course-Specific Data:**
- `data_starter_clean.csv` - Appetizer training data
- `data_main_clean.csv` - Main course training data
- `data_dessert_clean.csv` - Dessert training data

**Dimensional Data:**
- `dim_dishes.csv` - Dish dimension table
- `fact_menus.csv` - Menu facts
- `fact_menu_items.csv` - Menu items facts
- `menus_azca_v3_headers.csv` - Menu headers

**Menu History:**
- `menu_history_*.csv` - Historical menu records
  - `advanced_features` - With computed features
  - `advanced_shuffled` - Shuffled for training
  - `categorized` - With category labels
  - `clean` - Cleaned version

### `models/` — Trained Models
Serialized scikit-learn/XGBoost models ready for inference.

- `model_menus_v2.pkl` - Menu prediction model (v2)
- `label_encoders_menus_v2.pkl` - Category encoders for menus

**Note:** Production models are in `backend/azca/artifacts/`

---

## Workflow

### 1. Data Preparation
```bash
# Clean raw data
python backend/ml-training/src/clean_dataset.py

# Prepare features
python backend/ml-training/src/categorizacion_platos.py

# Combine datasets
python backend/ml-training/src/mezclar_datos.py
```

### 2. Train Models
```bash
# Standard training
python backend/ml-training/src/entrenamiento_base.py

# Latest version
python backend/ml-training/src/entrenar_v3.py
```

### 3. Deploy to Production
```bash
# Copy best model to production
cp backend/ml-training/models/model_menus_v2.pkl backend/azca/artifacts/

# Deploy backend
docker build -t azca:latest .
docker push azca:latest
```

---

## File Purpose Reference

| File | Type | Purpose |
|------|------|---------|
| `entrenamiento_base.py` | Script | Main training pipeline |
| `entrenar_v3.py` | Script | Latest improvements |
| `clean_dataset.py` | Script | Data quality steps |
| `categorizacion_platos.py` | Script | Feature engineering |
| `dataset_menus_final.csv` | Data | Main training dataset |
| `model_menus_v2.pkl` | Model | Serialized predictor |
| `label_encoders_menus_v2.pkl` | Model | Category mappings |

---

**Important:**
- Scripts in this directory are **one-time use** for training
- Keep trained models here for versioning/comparison
- Copy to `backend/azca/artifacts/` when ready for production
- Add new data to `data/` and update `.gitignore` if files are too large

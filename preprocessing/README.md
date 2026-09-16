# Jobnity Data Preprocessing Pipeline

This folder contains the complete ETL (Extract, Transform, Load) data preprocessing code used to generate Jobnity's core datasets from Kaggle raw industry data.

---

## Preprocessing Pipeline Architecture

```
[Kaggle Raw Datasets] ──> [1. build_job_roles.py] ───────> job_roles.csv
                      ──> [2. build_skills_taxonomy.py] ──> skills.csv & skill_aliases.csv
                      ──> [3. build_role_skills.py] ──────> role_skills.csv
                      ──> [4. build_learning_resources] ─> learning_resources.csv
                                                                     │
                                                                     v
                                                   [backend/scripts/import_datasets.py]
                                                                     │
                                                                     v
                                                         Final Database (jobnity.db)
```

---

## File Overview

1. **`build_job_roles.py`**:
   - Normalizes 52 benchmark job roles across 5 domain categories (Software Engineering, Data & AI, Cloud & Infrastructure, Cybersecurity, Product & Management).
2. **`build_skills_taxonomy.py`**:
   - Builds 1,156 canonical technical skills and 1,321 skill synonym/acronym mappings.
3. **`build_role_skills.py`**:
   - Generates the role-skill requirement matrix with `importance` (`Required` vs `Preferred`), `priority` levels (1-5), and `minimum_level`.
4. **`build_learning_resources.py`**:
   - Aggregates 125 curated courses, documentation links, and video tutorials mapped to missing skills.
5. **`run_all_preprocessing.py`**:
   - Master pipeline runner that executes all preprocessing steps in sequence and outputs clean CSV files to `backend/jobnitydatasets/`.

---

## How to Run the Preprocessing Pipeline

```bash
# Execute full preprocessing pipeline
python3 preprocessing/run_all_preprocessing.py

# Import processed CSV files into the SQLite database (jobnity.db)
python3 backend/scripts/import_datasets.py
```

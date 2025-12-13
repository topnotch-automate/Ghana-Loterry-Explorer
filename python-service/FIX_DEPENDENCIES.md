# Fix Python Dependencies

## Problem 1: Version Compatibility
Error: `cannot import name '_is_pandas_df' from 'sklearn.utils.validation'`

This is a version compatibility issue between scikit-learn and imbalanced-learn.

## Problem 2: Building from Source (Windows)
Error: `Unknown compiler(s)` when installing numpy

Pip is trying to build numpy from source but no C compiler is available.

## Solutions

### Step 1: Upgrade pip (IMPORTANT)

```bash
python -m pip install --upgrade pip setuptools wheel
```

### Step 2: Install Dependencies (Use Pre-built Wheels)

**Windows (Easiest - Use Script):**
```bash
cd python-service
install-simple.bat
```

**Windows (Manual):**
```bash
cd python-service
pip install --only-binary :all: numpy pandas scikit-learn imbalanced-learn flask flask-cors python-dotenv
```

**If --only-binary fails, try without it:**
```bash
pip install numpy pandas scikit-learn imbalanced-learn flask flask-cors python-dotenv
```

**Linux/Mac:**
```bash
cd python-service
pip install -r requirements.txt
```

### Step 3: If Still Failing - Install Specific Versions

```bash
pip install numpy==1.24.3 pandas==2.0.3 scikit-learn==1.3.2 imbalanced-learn==0.11.0 flask==3.0.0 flask-cors==4.0.0 python-dotenv==1.0.0
```

### Alternative: Use Conda (Easier on Windows)

```bash
conda install numpy pandas scikit-learn imbalanced-learn flask flask-cors python-dotenv -c conda-forge
```

## Virtual Environment Setup (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
pip install --only-binary :all: -r requirements.txt
```

## Current Requirements

The `requirements.txt` has been updated with version constraints:
- numpy>=1.24.0,<2.0.0
- pandas>=2.0.0,<3.0.0
- scikit-learn>=1.3.0,<1.5.0
- imbalanced-learn>=0.11.0,<0.13.0

## Fallback Code

The code has been updated to handle SMOTE import failures gracefully. If SMOTE fails, it will use sklearn's built-in resampling instead.

## Verify Installation

```bash
python -c "import numpy; import pandas; import sklearn; import imblearn; print('All dependencies OK')"
```

If this works without errors, dependencies are correctly installed.


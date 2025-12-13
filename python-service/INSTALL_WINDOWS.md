# Installing Python Dependencies on Windows

## Quick Fix for "Unknown compiler" Error

This error occurs because pip is trying to build packages from source, but Windows doesn't have a C compiler installed.

### Solution: Use Pre-built Wheels

**Step 1: Upgrade pip**
```bash
python -m pip install --upgrade pip setuptools wheel
```

**Step 2: Install with pre-built wheels only**
```bash
cd python-service
pip install --only-binary :all: numpy pandas scikit-learn imbalanced-learn flask flask-cors python-dotenv
```

**Or use the simple install script:**
```bash
cd python-service
install-simple.bat
```

### Alternative: Install Individual Packages

If the above doesn't work, install packages one by one:

```bash
pip install --only-binary :all: numpy
pip install --only-binary :all: pandas
pip install --only-binary :all: scikit-learn
pip install --only-binary :all: imbalanced-learn
pip install flask flask-cors python-dotenv
```

### If You Still Get Errors

**Option 1: Use Specific Versions with Wheels**
```bash
pip install numpy==1.24.3 pandas==2.0.3 scikit-learn==1.3.2 imbalanced-learn==0.11.0 flask==3.0.0 flask-cors==4.0.0 python-dotenv==1.0.0
```

**Option 2: Use Conda (Easier)**
```bash
conda install numpy pandas scikit-learn imbalanced-learn flask flask-cors python-dotenv -c conda-forge
```

**Option 3: Install Visual Studio Build Tools**
- Download from: https://visualstudio.microsoft.com/downloads/
- Install "Desktop development with C++" workload
- Then retry: `pip install -r requirements.txt`

## Recommended: Use Virtual Environment

```bash
# Create venv
python -m venv .venv

# Activate
.venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
pip install --only-binary :all: -r requirements.txt
```

## Verify Installation

```bash
python -c "import numpy, pandas, sklearn, imblearn, flask; print('✓ All packages installed successfully')"
```


const post = {
  slug:      'python-data-analysis',
  title:     'Python Data Analysis: EDA, Visualisation & Statistical Inference',
  category:  'project',
  emoji:     '🐍',
  color:     '#ec4899',
  date:      '2026-03-08',
  readTime:  '8 min',
  tags:      ['Python', 'Pandas', 'Matplotlib', 'Seaborn', 'NumPy', 'Jupyter', 'EDA'],
  githubUrl: 'https://github.com/Nishan052/python',
  excerpt:   'A collection of Jupyter notebooks covering the full exploratory data analysis workflow: data cleaning, statistical summarisation, and publication-quality visualisation with Pandas, Matplotlib, and Seaborn.',

  content: `
## Overview

Exploratory Data Analysis (EDA) is the foundation of every data science project. Before any model is trained, the data must be understood: its shape, distributions, missing values, outliers, and relationships between variables.

---

## The EDA Workflow

\`\`\`mermaid
flowchart TD
    A[Raw Dataset\nCSV or Excel or SQL] --> B[Load with Pandas]
    B --> C[Structural Inspection\n.info .dtypes .shape]
    C --> D[Missing Value Analysis\n.isnull heatmaps]
    D --> E{Impute or Drop?}
    E --> F[Distribution Analysis\nHistograms Box plots]
    F --> G[Correlation Analysis\nheatmaps pair plots]
    G --> H[Statistical Tests\nt-test chi-squared]
    H --> I[Feature Engineering\nEncode Scale Derive]
    I --> J[Summary and Insights\nMarkdown cells in Jupyter]
\`\`\`

---

## Core Libraries

### Pandas — Data Manipulation
Pandas provides the \`DataFrame\` — a two-dimensional, labelled data structure that is the lingua franca of Python data science. Key operations: filtering, groupby aggregation, merge, pivot, and time-series resampling.

### NumPy — Numerical Foundation
NumPy underpins Pandas, Matplotlib, and scikit-learn. Direct NumPy operations are 10–100× faster than Python loops on array data due to vectorised C-level operations.

### Matplotlib & Seaborn — Visualisation

\`\`\`mermaid
flowchart LR
    A[Matplotlib\nlow-level API\nprecise control] --> C[Seaborn\nhigh-level API\nstatistical plots]
    B[Pandas .plot\nconvenience wrapper] --> A
\`\`\`

Seaborn builds on Matplotlib, providing statistical visualisations with minimal boilerplate. It integrates directly with DataFrames.

---

## Key Analyses Demonstrated

### 1. Missing Value Heatmap
A heatmap reveals whether missingness is **random** (scattered) or **systematic** (whole columns/rows) — critical for choosing between imputation strategies.

### 2. Distribution Analysis
Histograms reveal skewness, bimodality, and outliers. Box plots compare distributions across groups and highlight outliers via the IQR method.

### 3. Correlation Heatmap
Correlation matrices surface **multicollinearity** before model training — two highly correlated features add redundancy, not signal.

### 4. Pair Plot for Multivariate Relationships
Seaborn pairplots show all pairwise scatter plots simultaneously, coloured by a target variable, revealing separability at a glance.

---

## Design Decisions

### Why Jupyter Notebooks?
Notebooks interleave code, output, and markdown narrative — making analysis **reproducible and communicable**. Each cell is independently executable, enabling iterative exploration.

### Why Seaborn over raw Matplotlib?
Seaborn reduces 15-line Matplotlib plots to 2-line calls for common statistical charts. Its defaults are publication-quality. Matplotlib is reserved for custom layouts that Seaborn cannot express.

### Why GroupBy before Modelling?
Understanding group-level statistics often surfaces the most actionable insights — and reveals whether a global model makes sense or whether subgroup models are needed.

---

## How to Recreate

\`\`\`bash
python3 -m venv .venv && source .venv/bin/activate
pip install pandas numpy matplotlib seaborn jupyter
jupyter notebook
\`\`\`
`,

  references: [
    { text: 'McKinney, W. (2022) Python for Data Analysis. 3rd edn. Sebastopol: O\'Reilly Media.' },
    { text: 'Waskom, M. (2021) "seaborn: statistical data visualization", Journal of Open Source Software, 6(60), p. 3021.', url: 'https://doi.org/10.21105/joss.03021' },
    { text: 'Harris, C.R. et al. (2020) "Array programming with NumPy", Nature, 585, pp. 357–362.', url: 'https://doi.org/10.1038/s41586-020-2649-2' },
    { text: 'Kluyver, T. et al. (2016) "Jupyter Notebooks — a publishing format for reproducible computational workflows". IOS Press, pp. 87–90.' },
  ],
};

export default post;

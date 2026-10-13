const post = {
  id:        2,
  slug:      'python-data-analysis',
  title:     'Python Data Analysis: EDA, Visualization & Statistical Inference',
  category:  'project',
  iconKey:   'Python',
  color:     '#ec4899',
  date:      '2026-03-08',
  readTime:  '8 min',
  tags:      ['Python', 'Pandas', 'Matplotlib', 'Seaborn', 'NumPy', 'Jupyter', 'EDA'],
  githubUrl: 'https://github.com/Nishan052/python',
  excerpt:   'A set of Jupyter notebooks where I go through exploratory data analysis step by step, from cleaning the data to plotting it with Seaborn.',

  content: `
## Understanding the data first

For me exploratory data analysis (EDA) is where every data science project starts. Before training any model you need to know the data's shape, distributions, missing values, outliers and how the variables relate.

---

## The EDA workflow

\`\`\`mermaid
flowchart TD
    A[Raw Dataset
CSV or Excel or SQL] --> B[Load with Pandas]
    B --> C[Structural Inspection
.info .dtypes .shape]
    C --> D[Missing Value Analysis
.isnull heatmaps]
    D --> E{Impute or Drop?}
    E --> F[Distribution Analysis
Histograms Box plots]
    F --> G[Correlation Analysis
heatmaps pair plots]
    G --> H[Statistical Tests
t-test chi-squared]
    H --> I[Feature Engineering
Encode Scale Derive]
    I --> J[Summary and Insights
Markdown cells in Jupyter]
\`\`\`

---

## Core libraries

### Pandas for data manipulation
Pandas gives you the \`DataFrame\`, a two-dimensional labeled data structure that's the common language of Python data science. The main operations are filtering, groupby aggregation, merge, pivot and time series resampling.

### NumPy as the numerical foundation
NumPy sits under Pandas, Matplotlib and scikit-learn, and its operations run 10–100× faster than Python loops on arrays, because they're vectorized in C.

### Matplotlib and Seaborn for visualization

\`\`\`mermaid
flowchart LR
    A[Matplotlib
low-level API
precise control] --> C[Seaborn
high-level API
statistical plots]
    B[Pandas .plot
convenience wrapper] --> A
\`\`\`

Seaborn builds on Matplotlib, so you get statistical plots straight from DataFrames with very little boilerplate.

---

## Analyses in the notebooks

### 1. Missing value heatmap
A heatmap shows whether missing values are scattered at random or fill whole columns or rows, and that decides the imputation strategy.

### 2. Distribution analysis
Histograms show skewness, bimodality and outliers, while box plots compare groups and flag outliers with the IQR method.

### 3. Correlation heatmap
A correlation matrix shows multicollinearity before you train, since two highly correlated features mostly repeat each other.

### 4. Pair plot for multivariate relationships
Seaborn's pairplot draws every pairwise scatter plot at once, colored by a target variable, showing at a glance whether the groups separate.

---

## Design decisions

### Jupyter notebooks
Notebooks mix code, output and markdown notes, which makes the analysis reproducible and easy to share. Each cell runs on its own, so you can explore step by step.

### Seaborn over raw Matplotlib
Seaborn turns a 15-line Matplotlib plot into a 2-line call for common statistical charts, and its defaults are ready to publish. I'd only use Matplotlib for custom layouts that Seaborn can't express.

### GroupBy before modeling
Statistics by group often give the most useful findings, and they show early whether one global model makes sense or each subgroup needs its own.

---

## How to recreate it

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

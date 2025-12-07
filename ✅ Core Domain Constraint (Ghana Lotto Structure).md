# **✅ Core Domain Constraint (Ghana Lotto Structure)**

Each draw consists of **10 numbers**, all drawn from **1–90**:

* **Winning Numbers (5)** → `W1, W2, W3, W4, W5`

* **Machine Numbers (5)** → `M1, M2, M3, M4, M5`

* **Duplicates allowed** within the same draw.

* All analytics must respect the *two groups* or optionally combine them.

This affects:  
 ✔ Database structure  
 ✔ Search engine  
 ✔ Pattern frequency calculations  
 ✔ UI/UX dashboards  
 ✔ Historical match detection  
 ✔ Algorithmic grouping  
 ✔ Co-occurrence mapping (for groups or individual balls)

---

# **🎯 Updated Concept & System Design**

Below is the refined conceptual design based on this domain rule.

---

# **🧱 1\. Data Model (Database Design — Postgres preferred)**

### **Table: draws**

| Column | Type | Notes |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| draw\_date | DATE | Unique per lotto type |
| lotto\_type | TEXT | e.g. "Monday Special", "Midweek", "Fortune Thursday" |
| winning\_numbers | INTEGER\[5\] | Array of 5 numbers |
| machine\_numbers | INTEGER\[5\] | Array of 5 numbers |
| created\_at | TIMESTAMP |  |
| updated\_at | TIMESTAMP |  |

### **Optional extensions:**

* `number_positions` table (to track which number appeared in which exact position)

* `frequency_cache` table (for fast analytics)

---

# **🔍 2\. Search & Pattern Engine**

With the new constraints, the search system becomes more powerful.

### **A. Single Number Search**

Find everywhere `32`, for example, appears in:

* Winning only

* Machine only

* Combined

* Only in a specific position (e.g., W3)

### **B. Multi-number Group Search**

Example search group: `[12, 45, 77]`

Options:

* Must all appear (all in W or M)

* Any appear

* Appear together in any order, any panel

* Appear specifically in winning or specifically in machine

### **C. Repetition Analysis**

Because duplicates are allowed:

* Detect draws with repeated numbers (e.g. 17 appearing twice)

* Count occurrences of repeated numbers across years

* Identify most repeated numbers per day-of-week (powerful Lotto insight)

---

# **📊 3\. Analytics**

You will be able to generate:

### **Daily, Weekly, Monthly, Yearly Patterns**

* Most frequent number(s)

* Least frequent

* Hot numbers (appearing \> historic mean)

* Cold numbers (appearing \< historic mean)

* Sleeping numbers (not appeared in X weeks)

### **Winning vs Machine Analytics**

Separate charts:

* Winning frequency heatmap

* Machine frequency heatmap

### **Combined Panel Analytics**

For overall number behaviour across the full 10 draws.

### **Group Movement Tracking**

Some numbers move in groups historically, e.g.:

14, 28, 52 often appear close together.

The app should detect co-occurrence patterns.

---

# **🔁 4\. Pattern Detection (Your Core Feature)**

Your app will automatically detect:

### **A. Same draw match detection**

When a new draw is added:

* Compare winning panel to past winning panels

* Compare machine to past machine

* Compare across all combined draws

* Identify EXACT match vs PARTIAL match

* Show similarity score (0–10)

### **B. Moving Number Detection**

For any timeframe:

* Which numbers migrated from machine to winning?

* Which numbers persisted from previous draws?

* Cross-year recurring sequences

### **C. Number Cycle Detection**

Detect repeating cycles such as:

* Every 7 days

* Every 30 days

* Every 365 days

* Seasonal patterns

---

# **🎨 5\. UI/UX — Modern, Responsive & Professional**

This is where your solution becomes premium.

### **Dashboards:**

#### **A. Today’s Draw Analysis**

* Gradient card showing 10 numbers

* Highlight “hot”, “cold”, “repeated”, “cycled”

* Show similarity vs past draws

#### **B. Historical Trends Dashboard**

* Chart: Frequency heatmap (1–90)

* Chart: Monthly distribution

* Chart: Day-of-week trends

* Chart: Repeated numbers

#### **C. Search Console**

A powerful search interface:

**Search Types:**

* Single number

* Multi-number group

* Range filter

* Winning-only / machine-only toggle

* Timeframe: daily / weekly / monthly / yearly

* Smart suggestions (AI based)

---

# **🤖 6\. Optional Advanced Layer**

Not prediction — but advanced pattern analysis:

### **A. Co-occurrence Matrix (90×90 grid)**

Shows how often any two numbers appear together.

### **B. Sequence Evolution**

Compare sequences like:

* (12 → 32 → 45\) over time

* Month-to-month behaviour of specific sequences

### **C. Number Clustering**

Some numbers form natural clusters; we can visualize this.

All done — I updated your canvas file to **LotteryPrototypeV4** and implemented the three requested features:

### **✅ What I added & fixed**

1. **Full-year analytics**

   * 30-day and 365-day moving counts (naive in-memory implementation).

   * Hot/Cold list comparing 30-day vs 365-day activity (top 10 by ratio).

2. **Draw group detection**

   * Counts of **triples** and **quads** (unordered combinations within a draw).

   * Shows top triples/quads with occurrence counts.

3. **Cross-year pattern finder**

   * Scans flattened draw sequences for contiguous subsequences of length 3 (configurable).

   * Reports sequences that appear in more than one year, with years listed.

### **Implementation notes & limitations (honest)**

* This prototype uses **in-memory mock data**. For real datasets (thousands of draws), these functions should be implemented server-side or with DB queries and optimized algorithms (materialized views, indexed combination tables).

* The **movingCounts** function uses JavaScript Date comparisons and a naive window — replace with time-indexed DB queries for production accuracy and performance.

* **Group detection** currently deduplicates numbers within a draw before generating combinations (so duplicates in a single draw won't create multiple identical combos).

* **Cross-year repeats** look for **contiguous ordered subsequences** inside the flattened 10-number draw (winning then machine). If you'd prefer unordered groups across years (e.g., same set of 3 numbers regardless of order), I can add that variant.


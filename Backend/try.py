import pandas as pd

df1 = pd.read_csv("data/dataset.csv")
df2 = pd.read_csv("data/symptom_Description.csv")
df3 = pd.read_csv("data/symptom_precaution.csv")
df4 = pd.read_csv("data/symptom-severity.csv")

print("dataset.csv columns:", df1.columns.tolist())
print("description columns:", df2.columns.tolist())
print("precaution columns:", df3.columns.tolist())
print("severity columns:", df4.columns.tolist())

print("\ndataset sample:\n", df1.head(2))
print("\ndescription sample:\n", df2.head(2))
print("\nprecaution sample:\n", df3.head(2))
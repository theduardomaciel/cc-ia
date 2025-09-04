import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text

# Carregar dataset
data = pd.read_csv("./data/dataset2.csv")  # supondo que salvou em CSV
X = data.drop(columns=["ID", "Risco"])
y = data["Risco"]

# One-Hot Encoding para atributos categóricos
X = pd.get_dummies(X)

# Construir árvore CART
cart = DecisionTreeClassifier(criterion="gini", max_depth=4, random_state=0)
cart.fit(X, y)

# Exibir árvore
print(export_text(cart, feature_names=list(X.columns)))

import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
log = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), "sales_data.csv")
MONTHS_TO_PREDICT = 3

def load_and_validate_csv(path):
    required = {"Date", "Product", "Quantity", "Revenue"}
    df = pd.read_csv(path, parse_dates=["Date"])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")
    df.sort_values("Date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df

def build_monthly_series(df, product):
    mask = df["Product"] == product
    monthly = (df[mask].resample("MS", on="Date")
               .agg(Quantity=("Quantity","sum"), Revenue=("Revenue","sum"))
               .reset_index())
    monthly["month_index"] = np.arange(len(monthly))
    return monthly

def train_and_predict(monthly, n_future):
    X = monthly[["month_index"]].values
    y = monthly["Quantity"].values
    model = LinearRegression()
    model.fit(X, y)
    fitted = model.predict(X).tolist()
    last_idx  = int(monthly["month_index"].iloc[-1])
    future_X  = np.arange(last_idx+1, last_idx+1+n_future).reshape(-1,1)
    future_y  = model.predict(future_X).tolist()
    last_date = monthly["Date"].iloc[-1]
    future_dates = pd.date_range(start=last_date+pd.DateOffset(months=1),
                                 periods=n_future, freq="MS")
    return {
        "slope":        round(float(model.coef_[0]), 4),
        "intercept":    round(float(model.intercept_), 4),
        "r_squared":    round(model.score(X, y), 4),
        "fitted":       [round(v,2) for v in fitted],
        "future_dates": [d.strftime("%Y-%m") for d in future_dates],
        "future_qty":   [round(max(0,v),2) for v in future_y],
    }

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "data_file": os.path.exists(DATA_PATH)}), 200

@app.route("/api/products", methods=["GET"])
def get_products():
    try:
        df = load_and_validate_csv(DATA_PATH)
        return jsonify({"products": sorted(df["Product"].unique().tolist())}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.route("/api/predict", methods=["GET"])
def predict():
    try:
        df = load_and_validate_csv(DATA_PATH)
        all_products = sorted(df["Product"].unique().tolist())
        product = request.args.get("product", all_products[0])
        if product not in all_products:
            return jsonify({"error": f"Unknown product '{product}'."}), 400
        try:
            n_future = max(1, min(12, int(request.args.get("months", MONTHS_TO_PREDICT))))
        except ValueError:
            return jsonify({"error": "'months' must be integer."}), 400
        monthly = build_monthly_series(df, product)
        if len(monthly) < 3:
            return jsonify({"error": "Need >= 3 months of data."}), 422
        m = train_and_predict(monthly, n_future)
        historical = [{"date": row["Date"].strftime("%Y-%m"),
                       "quantity": int(row["Quantity"]),
                       "revenue":  round(float(row["Revenue"]),2),
                       "fitted":   m["fitted"][i]}
                      for i, row in monthly.iterrows()]
        return jsonify({
            "product":     product,
            "historical":  historical,
            "forecast":    [{"date":d,"predicted_qty":q}
                            for d,q in zip(m["future_dates"], m["future_qty"])],
            "model_stats": {"slope":m["slope"],"intercept":m["intercept"],"r_squared":m["r_squared"]},
        }), 200
    except FileNotFoundError:
        return jsonify({"error": "sales_data.csv not found. Run data_generator.py first."}), 404
    except Exception as exc:
        log.exception("Error in /api/predict")
        return jsonify({"error": "Internal server error.", "detail": str(exc)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

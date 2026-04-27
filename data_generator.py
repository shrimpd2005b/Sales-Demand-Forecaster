import pandas as pd
import numpy as np
from datetime import date, timedelta
import random

def generate_sales_data(output_path: str = "sales_data.csv") -> None:
    np.random.seed(42)
    random.seed(42)
    products = ["Laptop Pro", "Wireless Earbuds", "Smart Watch", "USB-C Hub"]
    start_date = date(2023, 1, 1)
    records = []
    for product_idx, product in enumerate(products):
        base_quantity = 80 + product_idx * 25
        growth_rate   = 1.5 + product_idx * 0.4
        base_price    = [1200, 85, 250, 45][product_idx]
        for month_offset in range(24):
            current_date = start_date + timedelta(days=month_offset * 30)
            trend = growth_rate * month_offset
            month = current_date.month
            seasonal_factor = 1.0
            if month in (11, 12): seasonal_factor = 1.35
            elif month == 10:     seasonal_factor = 1.15
            elif month in (1, 2): seasonal_factor = 0.85
            noise    = np.random.normal(0, base_quantity * 0.08)
            quantity = max(10, int((base_quantity + trend) * seasonal_factor + noise))
            revenue  = round(quantity * base_price * np.random.uniform(0.95, 1.05), 2)
            records.append({"Date": current_date.strftime("%Y-%m-%d"),
                            "Product": product, "Quantity": quantity, "Revenue": revenue})
    df = pd.DataFrame(records).sort_values("Date").reset_index(drop=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} rows -> '{output_path}'")

if __name__ == "__main__":
    generate_sales_data()

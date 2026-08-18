# convert_symbols.py

import csv
import json
import os

input_file = "symbols.csv"
output_file = "symbols.js"

print(f"🔍 Looking for input CSV: {input_file}")

if not os.path.exists(input_file):
    print(f"❌ Input file '{input_file}' not found in: {os.getcwd()}")
    exit(1)

try:
    with open(input_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        data = []
        for row in reader:
            name = row.get("name", "").strip()
            symbol = row.get("symbol", "").strip()
            if name and symbol:
                data.append({"name": name, "symbol": symbol})
except Exception as e:
    print(f"❌ Error reading CSV: {e}")
    exit(1)

print(f"✅ Read {len(data)} rows from CSV.")

try:
    with open(output_file, "w", encoding="utf-8") as jsfile:
        jsfile.write("// Auto-generated from symbols.csv\n")
        jsfile.write("export const symbols = ")
        json.dump(data, jsfile, ensure_ascii=False, indent=2)
        jsfile.write(";\n")
except Exception as e:
    print(f"❌ Error writing JS file: {e}")
    exit(1)

print(f"✅ {output_file} written successfully in: {os.getcwd()}")

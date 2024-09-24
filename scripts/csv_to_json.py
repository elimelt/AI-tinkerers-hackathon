import datetime
import sys
import csv
import json

def csv_to_json(file_path):
  data = []
  with open(file_path, "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
      # parse in 2024-09-21 9:22:28 format
      date = datetime.datetime.strptime(row['timestamp'], "%Y-%m-%d %H:%M:%S")
      sql_timestamp = date.timestamp()
      reading = row['value']

      data.append({
        "timestamp": sql_timestamp,
        "glucose_value": reading
      })

  return json.dumps(data, indent=2)

if __name__ == "__main__":
  path = sys.argv[1]
  print(csv_to_json(path))
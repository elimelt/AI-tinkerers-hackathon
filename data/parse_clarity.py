import csv
import sys
import pandas as pd

if len(sys.argv) != 3:
    print("Usage: python parse_clarity.py <input_csv>")
    sys.exit(1)

input_csv = sys.argv[1]


def parse_clarity(input_csv):
    with open(input_csv, "r") as input_csv_file:
        csv_reader = csv.reader(input_csv_file)
        headers = next(csv_reader)

        raw_rows = list(csv_reader)[18:]
        parsed_rows = []

        for i, raw_row in enumerate(raw_rows):
            # print(i, row)

            timestamp = raw_row[1]
            event_type = raw_row[2]

            if event_type == "EGV":
                if raw_row[7] == "Low":
                    raw_row[7] = 40
                value = int(raw_row[7])
                parsed = [timestamp, value]

                print(i, parsed)

                parsed_rows.append(parsed)

        return parsed_rows


def rescale(x, new_min, new_max):
    old_min = x.min()
    old_max = x.max()
    return (
        (((x - old_min) / (old_max - old_min)) * (new_max - new_min) + new_min)
        .round()
        .astype(int)
    )


def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    # normalize to a less embarrassing range
    new_min = 40
    new_max = 270

    try:
        # Read the CSV file
        df = pd.DataFrame(parse_clarity(input_file), columns=["timestamp", "value"])

        # Convert timestamp to datetime
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        # Rescale the 'value' column
        df["value"] = rescale(df["value"].astype(int), new_min, new_max)

        df.to_csv(output_file, index=False)
        print(f"Data rescaled and written to {output_file}")

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

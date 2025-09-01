import ast

ee_rows = []

# Read and filter
with open('input.txt', 'r') as infile:
    for line in infile:
        line = line.strip()
        if line:
            row = ast.literal_eval(line.rstrip(','))
            if len(row) > 1 and row[1] == "EE":
                ee_rows.append(row)

# Write to output file
with open('output_file.txt', 'w') as outfile:
    for row in ee_rows:
        outfile.write(str(row) + '\n')

print(f"Found {len(ee_rows)} rows with 'EE' and saved to output_file.txt")
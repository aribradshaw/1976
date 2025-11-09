import csv
from pathlib import Path
import re

# Read the statepops.txt file
input_file = Path("voterdata/statepops.txt")
output_file = Path("voterdata/statepops_1976.csv")

print(f"Reading from: {input_file}")

# Read all lines
with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Skip header lines (first 2 lines)
data_lines = lines[2:]

# Parse data
state_data = []

# Territories and non-states to skip
skip_list = ['United States', 'American Samoa', 'Guam', 'Puerto Rico', 'U.S. Virgin Islands']

for line in data_lines:
    line = line.strip()
    if not line:
        continue
    
    # Split by tabs
    parts = line.split('\t')
    if len(parts) < 4:  # Need at least name, 1960, 1970, 1980
        continue
    
    name = parts[0].strip()
    
    # Skip if it's not a state (like "United States" or territories we don't need)
    # Check if name starts with any skip item
    should_skip = False
    for skip_item in skip_list:
        if name.startswith(skip_item) or skip_item in name:
            should_skip = True
            break
    if should_skip:
        continue
    
    # Also skip Northern Mariana Islands
    if 'Northern Mariana' in name:
        continue
    
    # Extract 1970 and 1980 populations (remove commas)
    try:
        # parts[0] = name, parts[1] = 1960, parts[2] = 1970, parts[3] = 1980
        pop_1970_str = parts[2].strip().replace(',', '')
        pop_1980_str = parts[3].strip().replace(',', '')
        
        # Remove any footnote markers like [ag], [ah], etc.
        pop_1970_str = re.sub(r'\[.*?\]', '', pop_1970_str)
        pop_1980_str = re.sub(r'\[.*?\]', '', pop_1980_str)
        
        pop_1970 = int(pop_1970_str)
        pop_1980 = int(pop_1980_str)
        
        # Calculate estimated 1976 population (linear interpolation)
        # 1976 is 6 years after 1970, 4 years before 1980
        # So it's 6/10 = 0.6 of the way from 1970 to 1980
        years_diff = 1980 - 1970  # 10 years
        years_to_1976 = 1976 - 1970  # 6 years
        ratio = years_to_1976 / years_diff  # 0.6
        
        pop_1976 = int(pop_1970 + (pop_1980 - pop_1970) * ratio)
        
        state_data.append({
            'State': name,
            'Population_1970': pop_1970,
            'Population_1980': pop_1980,
            'Population_1976_Estimated': pop_1976
        })
        
    except (ValueError, IndexError) as e:
        print(f"Warning: Could not parse line: {line[:50]}... Error: {e}")
        continue

# Sort by state name
state_data.sort(key=lambda x: x['State'])

# Write to CSV
print(f"\nWriting to: {output_file}")
with open(output_file, 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['State', 'Population_1970', 'Population_1980', 'Population_1976_Estimated']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    
    writer.writeheader()
    for row in state_data:
        writer.writerow(row)

print(f"Successfully created CSV with {len(state_data)} states/territories")
print(f"\nFirst 5 rows:")
for i, row in enumerate(state_data[:5], 1):
    print(f"  {i}. {row['State']}: 1970={row['Population_1970']:,}, 1980={row['Population_1980']:,}, 1976≈{row['Population_1976_Estimated']:,}")


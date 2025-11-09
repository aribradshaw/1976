import xml.etree.ElementTree as ET
import json
import re

# Parse the SVG file
tree = ET.parse('StatesServiced.svg')
root = tree.getroot()

# Get the SVG namespace
ns = {'svg': 'http://www.w3.org/2000/svg'}

# Extract all paths
paths = root.findall('.//svg:path', ns)

# Extract viewBox from root
viewBox = root.get('viewBox', '0 0 1000 600')
print(f"ViewBox: {viewBox}")

# Create a mapping of state abbreviations to path data
state_paths = {}

for path in paths:
    class_attr = path.get('class', '')
    # Extract state abbreviation from class (e.g., "sm_state sm_state_AK" -> "AK")
    match = re.search(r'sm_state_([A-Z]{2})', class_attr)
    if match:
        state_abbr = match.group(1)
        path_data = path.get('d', '')
        transform = path.get('transform', '')
        
        state_paths[state_abbr] = {
            'd': path_data,
            'transform': transform,
            'class': class_attr
        }

# Save to JSON file for use in React
with open('src/data/state_paths.json', 'w') as f:
    json.dump({
        'viewBox': viewBox,
        'paths': state_paths
    }, f, indent=2)

print(f"Extracted {len(state_paths)} state paths")
print(f"States found: {sorted(state_paths.keys())}")


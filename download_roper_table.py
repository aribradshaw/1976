import requests
from bs4 import BeautifulSoup
from pathlib import Path
import csv
import time

# URL of the Roper Center page
url = "https://ropercenter.cornell.edu/how-groups-voted-1976"

# Create voterdata folder if it doesn't exist
voterdata_dir = Path("voterdata")
voterdata_dir.mkdir(exist_ok=True)

print(f"Fetching table from: {url}")

try:
    # Fetch the webpage
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    
    print(f"Status: {response.status_code}")
    
    # Parse the HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find all tables
    tables = soup.find_all('table')
    print(f"Found {len(tables)} table(s)")
    
    if not tables:
        print("No tables found on the page!")
        # Try to find the table data in other formats
        # Sometimes tables are in divs or other structures
        print("Searching for alternative table structures...")
        exit(1)
    
    # Process each table
    for idx, table in enumerate(tables, 1):
        print(f"\nProcessing table {idx}...")
        
        # Extract table data
        rows = []
        for tr in table.find_all('tr'):
            cells = []
            for td in tr.find_all(['td', 'th']):
                # Get text and clean it up
                cell_text = td.get_text(strip=True)
                cells.append(cell_text)
            if cells:  # Only add non-empty rows
                rows.append(cells)
        
        if not rows:
            print(f"  Table {idx} is empty, skipping...")
            continue
        
        print(f"  Extracted {len(rows)} rows")
        
        # Save as CSV
        csv_filename = voterdata_dir / f"roper_1976_table_{idx}.csv"
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(rows)
        print(f"  [OK] Saved CSV: {csv_filename}")
        
        # Save as HTML (preserves original structure)
        html_filename = voterdata_dir / f"roper_1976_table_{idx}.html"
        with open(html_filename, 'w', encoding='utf-8') as f:
            f.write(f"<!DOCTYPE html>\n<html>\n<head><meta charset='utf-8'><title>Roper Center 1976 Table {idx}</title></head>\n<body>\n")
            f.write(str(table))
            f.write("\n</body>\n</html>")
        print(f"  [OK] Saved HTML: {html_filename}")
        
        # Also save as plain text (tab-separated)
        txt_filename = voterdata_dir / f"roper_1976_table_{idx}.txt"
        with open(txt_filename, 'w', encoding='utf-8') as f:
            for row in rows:
                f.write('\t'.join(row) + '\n')
        print(f"  [OK] Saved TXT: {txt_filename}")
        
        # Print first few rows for verification
        print(f"\n  First 5 rows preview:")
        for i, row in enumerate(rows[:5], 1):
            print(f"    Row {i}: {row[:5]}...")  # Show first 5 columns
    
    print("\n" + "="*60)
    print("Download complete!")
    print(f"Files saved in: {voterdata_dir.absolute()}")
    
except requests.exceptions.RequestException as e:
    print(f"Error fetching webpage: {e}")
except Exception as e:
    print(f"Error processing table: {e}")
    import traceback
    traceback.print_exc()


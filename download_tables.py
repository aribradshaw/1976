import requests
import os
from pathlib import Path
import time
from bs4 import BeautifulSoup
import re

# Create voterdata folder
voterdata_dir = Path("voterdata")
voterdata_dir.mkdir(exist_ok=True)

# URL of the page with all tables
page_url = "https://www.census.gov/data/tables/time-series/demo/voting-and-registration/p20-322.html"

# Use the correct URL format directly
base_url = "https://www2.census.gov/programs-surveys/cps/tables/p20/322"
table_urls = []
for i in range(1, 28):
    table_num = f"{i:02d}"
    url = f"{base_url}/tab{table_num}.pdf"
    table_urls.append((i, url))
print(f"Generated URLs for {len(table_urls)} tables using correct format")

print(f"Attempting to download {len(table_urls)} tables...")

# Download each table
for table_num, url in table_urls:
    filename = f"table_{table_num:02d}.pdf"
    filepath = voterdata_dir / filename
    
    try:
        print(f"Downloading Table {table_num}...")
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"  [OK] Saved: {filename}")
        else:
            print(f"  [FAIL] Status {response.status_code}: {url}")
            # Try alternative URL patterns (shouldn't be needed with correct format)
            alt_patterns = [
                f"https://www2.census.gov/programs-surveys/cps/tables/p20/322/tab{table_num:02d}.pdf",
            ]
            for alt_url in alt_patterns:
                try:
                    response = requests.get(alt_url, timeout=30)
                    if response.status_code == 200:
                        with open(filepath, 'wb') as f:
                            f.write(response.content)
                        print(f"  [OK] Saved (alt URL): {filename}")
                        break
                except Exception as e:
                    continue
            else:
                print(f"  [FAIL] All URL patterns failed for Table {table_num}")
        
        time.sleep(0.5)  # Be polite to the server
        
    except Exception as e:
        print(f"  [ERROR] Error downloading Table {table_num}: {e}")

print("\nDownload complete!")


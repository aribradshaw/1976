import os
from pathlib import Path
import pandas as pd
import re

# Try to import OCR libraries
try:
    import pdf2image
    import pytesseract
    from PIL import Image
    import numpy as np
    HAS_OCR = True
except ImportError:
    HAS_OCR = False
    print("ERROR: OCR libraries not installed!")
    print("Install with: pip install pdf2image pytesseract pillow numpy")
    exit(1)

# Check for Tesseract
try:
    # Try to find Tesseract
    # On Windows, common paths:
    possible_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    ]
    
    tesseract_found = False
    for path in possible_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            tesseract_found = True
            print(f"Found Tesseract at: {path}")
            break
    
    if not tesseract_found:
        # Try to get version (will fail if not in PATH)
        try:
            pytesseract.get_tesseract_version()
            print("Tesseract found in PATH")
            tesseract_found = True
        except:
            pass
    
    if not tesseract_found:
        print("\nERROR: Tesseract OCR not found!")
        print("Please install Tesseract OCR:")
        print("  Windows: https://github.com/UB-Mannheim/tesseract/wiki")
        print("  Or set pytesseract.pytesseract.tesseract_cmd to the tesseract.exe path")
        print("\nYou can also set it in this script by uncommenting:")
        print("  pytesseract.pytesseract.tesseract_cmd = r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'")
        exit(1)
        
except Exception as e:
    print(f"Error checking Tesseract: {e}")
    exit(1)

voterdata_dir = Path("voterdata")
csv_dir = voterdata_dir / "csv"
csv_dir.mkdir(exist_ok=True)

def extract_table_from_image(image):
    """Extract table data from an image using OCR"""
    # Use table detection mode
    text = pytesseract.image_to_string(image, config='--psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()%- ')
    
    # Parse lines
    lines = text.split('\n')
    table_data = []
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 3:  # Skip very short lines
            continue
        
        # Split by multiple spaces (table columns are usually separated by 2+ spaces)
        cells = re.split(r'\s{2,}', line)
        cells = [cell.strip() for cell in cells if cell.strip()]
        
        if cells and len(cells) > 1:  # Only add rows with multiple cells
            table_data.append(cells)
    
    return table_data

def convert_pdf_to_csv(pdf_path, csv_path):
    """Convert a PDF table to CSV using OCR"""
    print(f"Converting {pdf_path.name}...")
    
    try:
        # Convert PDF to images
        print("  Converting PDF to images...")
        # Try to find Poppler path
        poppler_path = None
        possible_poppler_paths = [
            r"C:\Users\4803109042\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin",
            r"C:\poppler\Library\bin",
            r"C:\Program Files\poppler\Library\bin",
        ]
        for path in possible_poppler_paths:
            if os.path.exists(path):
                poppler_path = path
                break
        
        if poppler_path:
            images = pdf2image.convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path)
        else:
            images = pdf2image.convert_from_path(pdf_path, dpi=300)
        print(f"  Found {len(images)} page(s)")
        
        all_rows = []
        
        for i, image in enumerate(images):
            print(f"  Processing page {i+1}/{len(images)}...")
            
            # Convert to grayscale for better OCR
            if image.mode != 'L':
                image = image.convert('L')
            
            # Enhance contrast
            img_array = np.array(image)
            # Increase contrast
            img_array = np.clip((img_array - 128) * 1.5 + 128, 0, 255).astype(np.uint8)
            enhanced_image = Image.fromarray(img_array)
            
            # Extract table data
            table_data = extract_table_from_image(enhanced_image)
            
            if table_data:
                all_rows.extend(table_data)
                print(f"    Extracted {len(table_data)} rows")
        
        if all_rows:
            # Find the maximum number of columns
            max_cols = max(len(row) for row in all_rows) if all_rows else 0
            
            # Pad rows to have the same number of columns
            padded_data = []
            for row in all_rows:
                padded_row = row + [''] * (max_cols - len(row))
                padded_data.append(padded_row[:max_cols])
            
            # Create DataFrame
            df = pd.DataFrame(padded_data)
            
            # Save to CSV
            df.to_csv(csv_path, index=False, encoding='utf-8')
            print(f"  [OK] Saved: {csv_path.name} ({len(padded_data)} rows, {max_cols} columns)")
            return True
        else:
            print(f"  [WARN] No data extracted from {pdf_path.name}")
            # Create empty CSV with note
            with open(csv_path, 'w', encoding='utf-8') as f:
                f.write("# No data extracted from PDF\n")
            return False
            
    except Exception as e:
        print(f"  [ERROR] Failed to convert {pdf_path.name}: {e}")
        import traceback
        traceback.print_exc()
        return False

# Convert all PDFs
pdf_files = sorted(voterdata_dir.glob("table_*.pdf"))
print(f"\nFound {len(pdf_files)} PDF files to convert\n")

success_count = 0
for pdf_file in pdf_files:
    csv_file = csv_dir / f"{pdf_file.stem}.csv"
    if convert_pdf_to_csv(pdf_file, csv_file):
        success_count += 1
    print()

print(f"\nConversion complete! {success_count}/{len(pdf_files)} files converted successfully")
print(f"CSV files saved in: {csv_dir}")

if success_count < len(pdf_files):
    print("\nNote: Some PDFs may have failed. Check the error messages above.")
    print("You may need to manually verify and clean up the CSV files.")

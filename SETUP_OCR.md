# Setting Up OCR for PDF to CSV Conversion

The Census Bureau PDFs are image-based (scanned tables), so we need OCR (Optical Character Recognition) to extract the data.

## Required Software

### 1. Tesseract OCR

**Windows:**
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install the latest version (recommended: tesseract-ocr-w64-setup-5.x.x.exe)
3. During installation, note the installation path (usually `C:\Program Files\Tesseract-OCR`)
4. Add Tesseract to your PATH:
   - Add `C:\Program Files\Tesseract-OCR` to your system PATH
   - Or set environment variable: `TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata`

**Alternative (if PATH doesn't work):**
You can set the path in Python:
```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### 2. Python Packages

All required packages are already installed:
- `pdf2image` - Converts PDF to images
- `pytesseract` - Python wrapper for Tesseract
- `pillow` - Image processing
- `numpy` - Array operations
- `pandas` - Data manipulation

### 3. Poppler (for pdf2image)

**Windows:**
1. Download from: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extract to a folder (e.g., `C:\poppler`)
3. Add `C:\poppler\Library\bin` to your PATH
   - Or set environment variable: `POPPLER_PATH=C:\poppler\Library\bin`

## Running the Conversion

Once Tesseract and Poppler are installed:

```bash
python convert_pdfs_to_csv.py
```

This will:
1. Read all PDFs from `voterdata/`
2. Convert each PDF to images
3. Use OCR to extract text
4. Parse the text into table format
5. Save as CSV files in `voterdata/csv/`

## Notes

- OCR accuracy depends on image quality
- The script processes each page at 300 DPI for better accuracy
- Some manual cleanup of CSV files may be needed after conversion
- Complex tables with merged cells may require additional processing



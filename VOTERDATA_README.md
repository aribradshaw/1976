# 1976 Voting and Registration Data

## Status

✅ **All 27 PDF tables downloaded successfully!**

All PDF files are located in the `voterdata/` folder:
- `table_01.pdf` through `table_27.pdf`

## Next Steps: Convert PDFs to CSV

The PDFs are image-based (scanned tables), so they require OCR (Optical Character Recognition) to extract the data.

### Quick Setup

1. **Install Tesseract OCR:**
   - Download from: https://github.com/UB-Mannheim/tesseract/wiki
   - Install the Windows version
   - Note the installation path (usually `C:\Program Files\Tesseract-OCR`)

2. **Install Poppler (for PDF to image conversion):**
   - Download from: https://github.com/oschwartz10612/poppler-windows/releases/
   - Extract to a folder (e.g., `C:\poppler`)
   - Add `C:\poppler\Library\bin` to your PATH

3. **Run the conversion script:**
   ```bash
   python convert_pdfs_to_csv.py
   ```

### What the Script Does

The `convert_pdfs_to_csv.py` script will:
1. Convert each PDF to high-resolution images (300 DPI)
2. Use Tesseract OCR to extract text from each image
3. Parse the text into table format (splitting by columns)
4. Save each table as a CSV file in `voterdata/csv/`

### Output

After running the conversion, you'll have:
- `voterdata/csv/table_01.csv` through `table_27.csv`
- Each CSV contains the extracted table data

### Notes

- OCR accuracy depends on image quality - the Census Bureau PDFs are generally good quality
- Some manual cleanup of CSV files may be needed (especially for complex tables)
- The script processes each page at 300 DPI for optimal accuracy
- Tables with merged cells or complex formatting may require additional processing

### Data Source

All data is from the U.S. Census Bureau report:
**"Voting and Registration in the Election of November 1976" (P20-322)**

Source: https://www.census.gov/data/tables/time-series/demo/voting-and-registration/p20-322.html

## Table Descriptions

The 27 tables cover various aspects of voting and registration in the 1976 election:

1. Reported Voting and Registration by Sex and Age
2. Reported Voting and Registration by Race, Spanish Origin, Sex, and Age
3. Reported Voting and Registration by Race, Spanish Origin, and Metropolitan-Nonmetropolitan Residence
4. Reported Voting and Registration by Race, Spanish Origin, Sex, and Age (Divisions)
5. Reported Voting and Registration in General and Primary Elections (25 Largest States)
6. Reported Voting and Registration (30 Largest SMSAs)
7. Reported Voting and Registration by Household Relationship, Race, and Sex
8. Reported Voting and Registration by Race, Sex, Age, and Marital Status
9. Reported Voting of Family Heads and Wives by Education
10. Reported Voting and Registration by Race, Spanish Origin, Sex, Age, and Education
11. Reported Voting and Registration by Race, Sex, Employment Status, and Class of Worker
12. Reported Voting and Registration of Employed Persons by Race, Sex, and Occupation
13. Reported Voting and Registration by Race, Age, Sex, and Family Income
14. Reported Voting and Registration by Race, Duration of Residence, Sex, and Age
15. Reported Reason Not Voting (Registered but Did Not Vote)
16. Reported Reason Not Registered to Vote
17. Reported Reason Not Voting in 1976 (Voted in 1972)
18. Reported Reason Not Registered in 1976 (Voted in 1972)
19. Reported Voting in 1976 and 1972 by Race, Spanish Origin, Sex, and Age
20. Reported Voting in 1976 and 1972 by Race, Sex, and Education
21. Year Last Voted (Did Not Vote in 1976) by Race, Age, Sex, and Education
22. Year Last Voted (Did Not Vote in 1976) by Race, Age, Sex, and Duration of Residence
23. Whether Ever Voted (Did Not Vote in 1976) by Race, Sex, and Age
24. Whether Ever Voted (Did Not Vote in 1976) by Race, Sex, and Education
25. Whether Ever Voted (Did Not Vote in 1976) by Race, Sex, and Occupation
26. Whether Ever Voted (Did Not Vote in 1976) by Race, Sex, and Family Income
27. Reported Voting and Registration by Type of Respondent, Race, Sex, and Age



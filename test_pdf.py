import pdfplumber
import os

pdf_path = r"C:\Users\Gaming\BioBistro\Enabiz-Tahlilleri 2.pdf"

if not os.path.exists(pdf_path):
    print("File not found:", pdf_path)
    exit(1)

out_path = r"C:\Users\Gaming\BioBistro\pdf_output_utf8.txt"

with open(out_path, "w", encoding="utf-8") as f_out:
    with pdfplumber.open(pdf_path) as pdf:
        for i in range(min(2, len(pdf.pages))):
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                f_out.write(f"--- PAGE {i+1} TEXT ---\n{text[:1000]}...\n")
                
            tables = page.extract_tables()
            if tables:
                f_out.write(f"--- PAGE {i+1} TABLES ---\n")
                for t_idx, table in enumerate(tables):
                    f_out.write(f"Table {t_idx+1}:\n")
                    for row in table[:10]:
                        f_out.write(str(row) + "\n")

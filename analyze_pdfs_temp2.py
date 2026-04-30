from services.pdf_parser import parse_enabiz_pdf
with open('02.09.2025.pdf', 'rb') as f:
    extraction = parse_enabiz_pdf(f.read())
for p in extraction.parameters:
    print(f"{p.name} | {p.result_value} | {p.reference_range}")

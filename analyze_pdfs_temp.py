import asyncio
from services.pdf_parser import parse_enabiz_pdf

pdfs = ['02.09.2025.pdf', '13.04.2026.pdf', '14.02.2026.pdf', '17.02.2026.pdf']

for pdf in pdfs:
    print(f'\n--- Analyzing {pdf} ---')
    try:
        with open(pdf, 'rb') as f:
            content = f.read()
        
        extraction = parse_enabiz_pdf(content)
        abnormal = []
        
        for p in extraction.parameters:
            try:
                val = float(p.result_value.replace(',', '.'))
                # basic check if reference range exists
                if '-' in p.reference_range:
                    parts = p.reference_range.split('-')
                    low = float(parts[0].strip().replace(',', '.'))
                    high = float(parts[1].strip().replace(',', '.'))
                    if val < low or val > high:
                        abnormal.append(f"{p.name}: {val} (Ref: {p.reference_range})")
                elif '<' in p.reference_range:
                    max_val = float(p.reference_range.replace('<', '').strip().replace(',', '.'))
                    if val > max_val:
                        abnormal.append(f"{p.name}: {val} (Ref: {p.reference_range})")
                elif '>' in p.reference_range:
                    min_val = float(p.reference_range.replace('>', '').strip().replace(',', '.'))
                    if val < min_val:
                        abnormal.append(f"{p.name}: {val} (Ref: {p.reference_range})")
            except Exception:
                pass
        
        for a in abnormal:
            print(a)
            
    except Exception as e:
        print('Error:', e)

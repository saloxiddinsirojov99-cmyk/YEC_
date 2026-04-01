import sys

with open(r'd:\YEC_SOLD\front\build_log.txt', 'rb') as f:
    content = f.read()
    try:
        # Try different encodings
        for encoding in ['utf-16', 'utf-8', 'cp1252']:
            try:
                print(f"--- Encoding: {encoding} ---")
                print(content.decode(encoding))
                break
            except:
                continue
    except Exception as e:
        print(f"Error: {e}")

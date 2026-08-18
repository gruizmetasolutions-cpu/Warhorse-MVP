import os
import re

dir_path = r'C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src'

replacements = [
    (r"background:\s*'rgba\(26,\s*26,\s*27,\s*0\.7\)'", "background: 'var(--bg-glass)'"),
    (r"background:\s*'rgba\(20,24,29,0\.55\)'", "background: 'var(--bg-overlay)'"),
    (r"background:\s*'rgba\(20,\s*24,\s*29,\s*0\.55\)'", "background: 'var(--bg-overlay)'"),
]

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in replacements:
                new_content = re.sub(pattern, repl, new_content)
                
            if new_content != content:
                print(f"Updated {file}")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

print("Done")

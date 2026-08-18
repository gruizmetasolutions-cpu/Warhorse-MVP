filepath = r'C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Catalogo.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("\\'", "'")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

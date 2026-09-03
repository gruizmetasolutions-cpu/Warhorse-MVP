import os
import shutil

src_dir = r'C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\dist'
dest_dir = r'C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html'

for item in os.listdir(src_dir):
    s = os.path.join(src_dir, item)
    d = os.path.join(dest_dir, item)
    if os.path.isdir(s):
        if os.path.exists(d): 
            shutil.rmtree(d)
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

print('Copied dist files to deploy/public_html!')

import os
import ftplib

server = 'ftp.dataholics.com.mx'
user = 'DEV_warhorse@warhorse.dataholics.com.mx'
password = '2k@r~mD5K.Y?'

files_to_upload = [
    'app/Controllers/Api/V1/RequisicionesController.php',
    'app/Services/RequisicionService.php',
    'app/Database/Migrations/2026-08-19-123400_AddCantidadToRequisiciones.php'
]

print("Connecting to FTP...")
ftp = ftplib.FTP()
ftp.connect(server, 21, timeout=30)
ftp.login(user, password)
ftp.set_pasv(True)

def upload_file(local_path, remote_path):
    remote_dir = os.path.dirname(remote_path)
    
    # change dir safely
    ftp.cwd('/')
    parts = remote_dir.strip('/').split('/')
    for p in parts:
        if p:
            try:
                ftp.cwd(p)
            except:
                ftp.mkd(p)
                ftp.cwd(p)
                
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {os.path.basename(remote_path)}', f)
    print(f"Uploaded {os.path.basename(remote_path)} to {remote_dir}")

for f in files_to_upload:
    local_path = os.path.join('apps', 'api', f)
    # The API lives under /api (or /public_html/api)
    # Wait, the previous upload script uploaded API files to /warhorse_app/
    remote_path = f"/warhorse_app/{f}"
    upload_file(local_path, remote_path)

ftp.quit()

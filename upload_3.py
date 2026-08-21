import os
import ftplib
import sys
import ssl

ftp_host = "warhorse.dataholics.com.mx"
ftp_user = "c89487_warh_d"
ftp_pass = "D1m4c1r4!"

files = [
    'app/Controllers/Api/V1/RequisicionesController.php',
    'app/Services/RequisicionService.php',
    'app/Database/Migrations/2026-08-19-123400_AddCantidadToRequisiciones.php'
]

print("Connecting to FTP...")
context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE
ftp = ftplib.FTP_TLS(context=context)
ftp.connect(ftp_host, 21)
ftp.login(ftp_user, ftp_pass)
ftp.prot_p()

for file_path in files:
    local_path = os.path.join('apps', 'api', file_path)
    remote_path = '/warhorse_app/' + file_path
    remote_dir = os.path.dirname(remote_path)
    
    # ensure dir exists
    try:
        ftp.cwd(remote_dir)
    except:
        parts = remote_dir.split('/')
        cwd = '/'
        for part in parts:
            if not part: continue
            cwd += part + '/'
            try:
                ftp.cwd(cwd)
            except:
                ftp.mkd(cwd)
                ftp.cwd(cwd)
    
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {os.path.basename(remote_path)}', f)
    print(f"Uploaded {file_path}")

ftp.quit()

import os
import ftplib
import sys

ftp_host = "warhorse.dataholics.com.mx"
ftp_user = "c89487_warh_d"
ftp_pass = "D1m4c1r4!"

files_to_upload = [
    'app/Controllers/Api/V1/RequisicionesController.php',
    'app/Services/RequisicionService.php',
    'app/Database/Migrations/2026-08-19-123400_AddCantidadToRequisiciones.php'
]

print("Connecting to FTP...")
ftp = ftplib.FTP(ftp_host)
ftp.login(ftp_user, ftp_pass)

for f in files_to_upload:
    local_path = os.path.join('apps', 'api', f)
    remote_path = f"/warhorse_app/{f}"
    with open(local_path, 'rb') as file:
        ftp.storbinary(f'STOR {remote_path}', file)
    print(f"Uploaded {f} to {os.path.dirname(remote_path)}")

ftp.quit()

import ftplib

def upload_modified_files_only():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    base_local = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app"
    
    # Precise list of modified API source files relative to app/
    files_to_upload = [
        "Config/Routes.php",
        "Controllers/Api/V1/ComprasController.php",
        "Controllers/Api/V1/RequisicionesController.php",
        "Controllers/Api/V1/UnidadesController.php",
        "Libraries/RespuestasApi.php",
        "Models/RequisicionModel.php",
        "Services/RequisicionService.php",
        "Services/TallerService.php",
        "Database/Migrations/2026-07-21-000001_UpdateFunctionalSpecs.php"
    ]
    
    for rel in files_to_upload:
        local_path = os.path.join(base_local, rel.replace('/', os.sep))
        remote_path = "warhorse_app/app/" + rel
        
        print(f"Uploading {rel} -> {remote_path}")
        
        # Navigate to target remote directory
        remote_dir = "/".join(remote_path.split('/')[:-1])
        filename = remote_path.split('/')[-1]
        
        ftp.cwd('/')
        try:
            ftp.cwd(remote_dir)
        except Exception:
            # Create missing subdirectories if needed
            parts = remote_dir.split('/')
            curr = ''
            for p in parts:
                curr += '/' + p
                try:
                    ftp.mkd(curr)
                except Exception:
                    pass
            ftp.cwd(remote_dir)
            
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {filename}', f)
            
    print("\nSelective upload of modified API files complete!")
    ftp.quit()

if __name__ == '__main__':
    import os
    upload_modified_files_only()

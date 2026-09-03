import ftplib

def upload_target_app():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Uploading target warhorse_app/app directory ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    local_app = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app"
    
    def upload_dir(local_dir, remote_dir):
        print(f"Sync {local_dir} -> {remote_dir}")
        try:
            ftp.mkd(remote_dir)
        except Exception:
            pass
        ftp.cwd(remote_dir)
        
        for item in os.listdir(local_dir):
            local_path = os.path.join(local_dir, item)
            if os.path.isdir(local_path):
                upload_dir(local_path, item)
                ftp.cwd('..')
            else:
                with open(local_path, 'rb') as f:
                    ftp.storbinary(f'STOR {item}', f)
                    
    ftp.cwd('/')
    import os
    upload_dir(local_app, 'warhorse_app/app')
    print("Upload completed successfully!")
    ftp.quit()

if __name__ == '__main__':
    upload_target_app()

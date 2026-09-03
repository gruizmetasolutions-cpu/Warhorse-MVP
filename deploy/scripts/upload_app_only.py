import ftplib
import os

def upload_only_app():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    local_app = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\warhorse_app\app"
    
    # Upload only app/ directory under warhorse_app
    def upload_dir(local_dir, remote_dir):
        print(f"Uploading {local_dir} -> {remote_dir}")
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
    upload_dir(local_app, 'warhorse_app/app')
    print("App code upload completed!")
    ftp.quit()

if __name__ == '__main__':
    upload_only_app()

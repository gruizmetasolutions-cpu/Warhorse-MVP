import ftplib

def upload_env_only():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Uploading ONLY warhorse_app/.env ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    local_path = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\warhorse_app\.env"
    
    ftp.cwd('warhorse_app')
    with open(local_path, 'rb') as f:
        ftp.storbinary('STOR .env', f)
        
    print(".env uploaded successfully!")
    ftp.quit()

if __name__ == '__main__':
    upload_env_only()

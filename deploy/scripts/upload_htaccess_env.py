import ftplib

def upload_htaccess_and_env():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Uploading .htaccess and .env ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    # Upload .htaccess
    ftp.cwd('public_html')
    htaccess = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\.htaccess"
    with open(htaccess, 'rb') as f:
        ftp.storbinary('STOR .htaccess', f)
    print("  .htaccess uploaded")
    
    # Upload .env
    ftp.cwd('/')
    ftp.cwd('warhorse_app')
    env_file = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\warhorse_app\.env"
    with open(env_file, 'rb') as f:
        ftp.storbinary('STOR .env', f)
    print("  .env uploaded")
    
    print("Done!")
    ftp.quit()

if __name__ == '__main__':
    upload_htaccess_and_env()

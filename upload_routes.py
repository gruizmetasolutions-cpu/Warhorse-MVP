import ftplib

def upload_routes():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Uploading Routes.php to warhorse_app/app/Config/ ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    ftp.cwd('warhorse_app/app/Config')
    
    local_path = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Config\Routes.php"
    with open(local_path, 'rb') as f:
        ftp.storbinary('STOR Routes.php', f)
    
    print("Routes.php uploaded successfully!")
    ftp.quit()

if __name__ == '__main__':
    upload_routes()

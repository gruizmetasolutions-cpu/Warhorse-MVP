import ftplib

def upload_auth_controller():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Uploading AuthController.php ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    ftp.cwd('warhorse_app/app/Controllers/Api/V1')
    
    local_path = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Controllers\Api\V1\AuthController.php"
    with open(local_path, 'rb') as f:
        ftp.storbinary('STOR AuthController.php', f)
    
    print("AuthController.php uploaded successfully!")
    ftp.quit()

if __name__ == '__main__':
    upload_auth_controller()

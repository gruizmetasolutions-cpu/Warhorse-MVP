import ftplib
import os

def upload_diag2():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Uploading diag2.php to public_html ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    ftp.cwd('public_html')
    
    local_path = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\diag2.php"
    with open(local_path, 'rb') as f:
        ftp.storbinary('STOR diag2.php', f)
    
    print("diag2.php uploaded successfully!")
    ftp.quit()

if __name__ == '__main__':
    upload_diag2()

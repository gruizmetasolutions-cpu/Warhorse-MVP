import ftplib

def force_upload_index():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    ftp.cwd('public_html')
    
    local_path = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\index.html"
    print(f"Uploading index.html directly from {local_path}...")
    with open(local_path, 'rb') as f:
        ftp.storbinary('STOR index.html', f)
        
    print("Direct index.html upload complete!")
    ftp.quit()

if __name__ == '__main__':
    force_upload_index()

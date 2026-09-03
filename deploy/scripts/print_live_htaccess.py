import ftplib

def print_live_htaccess():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    ftp.cwd('public_html')
    
    contents = []
    ftp.retrbinary('RETR .htaccess', contents.append)
    text = b"".join(contents).decode('utf-8')
    print("\n--- .htaccess on FTP server ---")
    print(text)
    print("---------------------------------")
    
    ftp.quit()

if __name__ == '__main__':
    print_live_htaccess()

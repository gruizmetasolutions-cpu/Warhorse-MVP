import ftplib

def list_remote_assets_detailed():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    print("\n--- Listing public_html/assets/ with sizes ---")
    ftp.cwd('public_html/assets')
    
    lines = []
    ftp.retrlines('LIST', lines.append)
    for line in lines:
        print(line)
        
    ftp.quit()

if __name__ == '__main__':
    list_remote_assets_detailed()

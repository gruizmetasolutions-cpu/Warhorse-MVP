import ftplib

def inspect_assets():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    print("\n--- Listing public_html/ ---")
    ftp.cwd('public_html')
    for f in sorted(ftp.nlst()):
        print(f"  {f}")
        
    print("\n--- Listing public_html/assets/ ---")
    ftp.cwd('assets')
    for f in sorted(ftp.nlst()):
        print(f"  {f}")
        
    ftp.quit()

if __name__ == '__main__':
    inspect_assets()

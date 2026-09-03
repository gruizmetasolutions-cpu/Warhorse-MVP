import ftplib

def print_ftp_root_structure():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    print("\n--- FTP Root ---")
    for f in sorted(ftp.nlst()):
        print(f"  {f}")
        
    try:
        ftp.cwd('public_html')
        print("\n--- public_html contents ---")
        for f in sorted(ftp.nlst()):
            print(f"  {f}")
    except Exception as e:
        print("Failed to cwd to public_html:", e)
        
    ftp.quit()

if __name__ == '__main__':
    print_ftp_root_structure()

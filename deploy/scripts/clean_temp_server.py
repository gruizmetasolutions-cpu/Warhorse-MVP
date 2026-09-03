import ftplib

def remove_temp_files():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Deleting temporary diagnostic files from server...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    ftp.cwd('public_html')
    
    temp_files = ['diag.php', 'diag2.php']
    for tf in temp_files:
        try:
            ftp.delete(tf)
            print(f"  Deleted {tf}")
        except Exception as e:
            print(f"  Could not delete {tf}: {e}")
            
    ftp.quit()

if __name__ == '__main__':
    remove_temp_files()

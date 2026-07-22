import ftplib

def print_ftp_toplevel_index():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    # We retrieve the top-level index.html (FTP root) and print its contents
    contents = []
    try:
        ftp.retrbinary('RETR index.html', contents.append)
        html_text = b"".join(contents).decode('utf-8')
        print("\n--- index.html at FTP ROOT ---")
        print(html_text)
        print("-------------------------------")
    except Exception as e:
        print("Could not read top-level index.html:", e)
        
    # Also print top-level .htaccess
    contents_ht = []
    try:
        ftp.retrbinary('RETR .htaccess', contents_ht.append)
        htaccess_text = b"".join(contents_ht).decode('utf-8')
        print("\n--- .htaccess at FTP ROOT ---")
        print(htaccess_text)
        print("------------------------------")
    except Exception as e:
        print("Could not read top-level .htaccess:", e)
        
    ftp.quit()

if __name__ == '__main__':
    print_ftp_toplevel_index()

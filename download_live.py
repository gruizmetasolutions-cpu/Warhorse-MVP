import ftplib

def download_live_htaccess():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Downloading live .htaccess from public_html ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    ftp.cwd('public_html')
    
    # List all files to see what's there
    print("\n--- Files in public_html ---")
    files = ftp.nlst()
    for f in sorted(files):
        print(f"  {f}")
    
    # Download the live .htaccess
    local_path = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\live_htaccess.txt"
    with open(local_path, 'wb') as f:
        ftp.retrbinary('RETR .htaccess', f.write)
    print(f"\nDownloaded .htaccess to {local_path}")
    
    # Also check if index.php exists and download it
    local_index = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\live_index_php.txt"
    try:
        with open(local_index, 'wb') as f:
            ftp.retrbinary('RETR index.php', f.write)
        print(f"Downloaded index.php to {local_index}")
    except Exception as e:
        print(f"index.php download failed: {e}")
    
    # Check if diag.php exists
    try:
        size = ftp.size('diag.php')
        print(f"diag.php exists on server, size: {size} bytes")
    except Exception as e:
        print(f"diag.php NOT found: {e}")
    
    ftp.quit()

if __name__ == '__main__':
    download_live_htaccess()

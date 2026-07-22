import ftplib

def download_live_routes():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Downloading live files from warhorse_app ...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    base = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse"
    
    files_to_download = {
        'warhorse_app/app/Config/Routes.php': 'live_Routes.php',
        'warhorse_app/app/Config/App.php': 'live_App.php',
        'warhorse_app/app/Config/Filters.php': 'live_Filters.php',
        'warhorse_app/app/Config/Routing.php': 'live_Routing.php',
        'warhorse_app/.env': 'live_env.txt',
        'warhorse_app/app/Controllers/Api/V1/AuthController.php': 'live_AuthController.php',
    }
    
    for remote, local_name in files_to_download.items():
        local_path = f"{base}\\{local_name}"
        try:
            with open(local_path, 'wb') as f:
                ftp.retrbinary(f'RETR {remote}', f.write)
            size = ftp.size(remote)
            print(f"  OK {remote} ({size} bytes) -> {local_name}")
        except Exception as e:
            print(f"  FAIL {remote}: {e}")
    
    # Also list warhorse_app/app/Config/
    print("\n--- warhorse_app/app/Config/ contents ---")
    ftp.cwd('warhorse_app/app/Config')
    files = ftp.nlst()
    for f in sorted(files):
        print(f"  {f}")
    
    ftp.quit()

if __name__ == '__main__':
    download_live_routes()

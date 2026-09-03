import ftplib

def upload_to_both_locations():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    local_index = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\index.html"
    local_htaccess = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\.htaccess"
    local_assets_dir = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\assets"
    
    import os

    def make_dir_safe(ftp, name):
        try:
            ftp.mkd(name)
        except:
            pass

    # 1. Upload .htaccess to FTP Root and public_html root
    print("Uploading .htaccess to FTP Root...")
    ftp.cwd('/')
    with open(local_htaccess, 'rb') as f:
        ftp.storbinary('STOR .htaccess', f)

    print("Uploading .htaccess to public_html/...")
    ftp.cwd('/public_html')
    with open(local_htaccess, 'rb') as f:
        ftp.storbinary('STOR .htaccess', f)

    # 2. Upload Dashboard SPA to FTP Root's /app/
    print("Uploading dashboard index.html to /app/ ...")
    ftp.cwd('/')
    make_dir_safe(ftp, 'app')
    ftp.cwd('app')
    with open(local_index, 'rb') as f:
        ftp.storbinary('STOR index.html', f)

    print("Syncing assets to /app/assets/ ...")
    make_dir_safe(ftp, 'assets')
    ftp.cwd('assets')
    for item in os.listdir(local_assets_dir):
        local_asset_path = os.path.join(local_assets_dir, item)
        if os.path.isfile(local_asset_path):
            with open(local_asset_path, 'rb') as f:
                ftp.storbinary(f'STOR {item}', f)

    # 3. Upload Dashboard SPA to public_html/app/
    print("Uploading dashboard index.html to public_html/app/ ...")
    ftp.cwd('/public_html')
    make_dir_safe(ftp, 'app')
    ftp.cwd('app')
    with open(local_index, 'rb') as f:
        ftp.storbinary('STOR index.html', f)

    print("Syncing assets to public_html/app/assets/ ...")
    make_dir_safe(ftp, 'assets')
    ftp.cwd('assets')
    for item in os.listdir(local_assets_dir):
        local_asset_path = os.path.join(local_assets_dir, item)
        if os.path.isfile(local_asset_path):
            with open(local_asset_path, 'rb') as f:
                ftp.storbinary(f'STOR {item}', f)

    print("Double upload complete!")
    ftp.quit()

if __name__ == '__main__':
    upload_to_both_locations()

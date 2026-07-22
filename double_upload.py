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
    
    # Files to upload
    local_index = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\index.html"
    local_htaccess = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\.htaccess"
    
    # 1. Upload to FTP root
    print("Uploading index.html and .htaccess to FTP Root...")
    ftp.cwd('/')
    with open(local_index, 'rb') as f:
        ftp.storbinary('STOR index.html', f)
    with open(local_htaccess, 'rb') as f:
        ftp.storbinary('STOR .htaccess', f)
        
    # Copy new assets directory to root/assets as well
    print("Syncing assets to FTP root/assets/ ...")
    local_assets_dir = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\assets"
    
    import os
    try:
        ftp.mkd('assets')
    except:
        pass
    ftp.cwd('assets')
    
    for item in os.listdir(local_assets_dir):
        local_asset_path = os.path.join(local_assets_dir, item)
        if os.path.isfile(local_asset_path):
            with open(local_asset_path, 'rb') as f:
                ftp.storbinary(f'STOR {item}', f)
                
    # 2. Upload to public_html
    print("Uploading index.html and .htaccess to public_html/...")
    ftp.cwd('/')
    ftp.cwd('public_html')
    with open(local_index, 'rb') as f:
        ftp.storbinary('STOR index.html', f)
    with open(local_htaccess, 'rb') as f:
        ftp.storbinary('STOR .htaccess', f)
        
    print("Syncing assets to public_html/assets/ ...")
    try:
        ftp.mkd('assets')
    except:
        pass
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

import os
import ftplib
import sys

def upload_directory(ftp, local_dir, remote_dir):
    try:
        ftp.cwd(remote_dir)
        print(f"Switched to remote directory: {remote_dir}")
    except ftplib.error_perm:
        try:
            ftp.mkd(remote_dir)
            ftp.cwd(remote_dir)
            print(f"Created and switched to remote directory: {remote_dir}")
        except Exception as e:
            print(f"Failed to create directory {remote_dir}: {e}")
            return

    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        if os.path.isdir(local_path):
            upload_directory(ftp, local_path, item)
            ftp.cwd('..')
        else:
            print(f"Uploading {item}...")
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {item}', f)

def main():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    local_dist = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web-corporate\dist"
    
    print("\n--- UPLOADING CORPORATE TO FTP ROOT (/) ---")
    ftp.cwd('/')
    upload_directory(ftp, local_dist, '/')
    
    print("\n--- UPLOADING CORPORATE TO public_html ---")
    ftp.cwd('/')
    upload_directory(ftp, local_dist, 'public_html')
    
    ftp.quit()

if __name__ == '__main__':
    main()

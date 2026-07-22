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
            print(f"Uploading {local_path}...")
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {item}', f)

def main():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    try:
        ftp = ftplib.FTP()
        ftp.connect(server, 21, timeout=30)
        ftp.login(user, password)
        ftp.set_pasv(True)
        print("Connected successfully!")
    except Exception as e:
        print(f"FTP connection failed: {e}")
        sys.exit(1)

    try:
        local_public_html = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html"
        print("\n--- UPLOADING FRONTEND TO FTP ROOT (/) ---")
        upload_directory(ftp, local_public_html, '/')
        
        print("\n--- UPLOADING FRONTEND TO public_html ---")
        upload_directory(ftp, local_public_html, 'public_html')
        
        print("\nDual location frontend upload completed successfully!")
    except Exception as e:
        print(f"Error during upload: {e}")
    finally:
        ftp.quit()

if __name__ == '__main__':
    main()

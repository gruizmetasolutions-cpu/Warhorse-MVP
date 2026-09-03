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
            # Ignore .git or other temporary/hidden directories if they somehow exist
            if item in ['.git', 'node_modules', 'tests', 'test-results', 'debugbar']:
                continue
            upload_directory(ftp, local_path, item)
            ftp.cwd('..')
        else:
            # We want to transfer binaries (images, pdfs, compiled JS/CSS) as binary, text as ASCII
            # But transferring everything as Binary is safer.
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
        # Enable passive mode
        ftp.set_pasv(True)
        print("Connected successfully!")
    except Exception as e:
        print(f"FTP connection failed: {e}")
        sys.exit(1)

    try:
        # Let's inspect directory contents first
        print("Current directories on FTP:")
        print(ftp.nlst())

        # 1. Upload public_html contents
        print("\n--- UPLOADING public_html ---")
        local_public_html = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html"
        upload_directory(ftp, local_public_html, 'public_html')

        # Go back to the FTP root
        ftp.cwd('/')

        # 2. Upload warhorse_app contents
        print("\n--- UPLOADING warhorse_app ---")
        local_warhorse_app = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\warhorse_app"
        upload_directory(ftp, local_warhorse_app, 'warhorse_app')

        print("\nUpload completed successfully!")
    except Exception as e:
        print(f"Error during upload: {e}")
    finally:
        ftp.quit()

if __name__ == '__main__':
    main()

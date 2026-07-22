import ftplib

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
        print("Connected!")
    except Exception as e:
        print(f"FTP connection failed: {e}")
        return

    try:
        # Upload updated .htaccess to public_html
        ftp.cwd('public_html')
        local_htaccess = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\.htaccess"
        print("Uploading updated .htaccess...")
        with open(local_htaccess, 'rb') as f:
            ftp.storbinary('STOR .htaccess', f)
        
        # Navigate back and upload .env
        ftp.cwd('/')
        ftp.cwd('warhorse_app')
        local_env = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\warhorse_app\.env"
        print("Uploading updated .env...")
        with open(local_env, 'rb') as f:
            ftp.storbinary('STOR .env', f)

        print("Upload completed!")
    except Exception as e:
        print(f"Error during upload: {e}")
    finally:
        ftp.quit()

if __name__ == '__main__':
    main()

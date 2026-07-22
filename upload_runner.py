import ftplib

def main():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    print("Deleting root scratch files...")
    root_files = ['run_migrations.php', 'index_test.php', 'test_paths.php']
    for rf in root_files:
        try:
            ftp.delete(rf)
            print(f"Deleted root {rf}")
        except Exception as e:
            print(f"Failed deleting root {rf}: {e}")
            
    print("Deleting public_html scratch files...")
    try:
        ftp.cwd('public_html')
        for rf in root_files:
            try:
                ftp.delete(rf)
                print(f"Deleted public_html {rf}")
            except Exception as e:
                print(f"Failed deleting public_html {rf}: {e}")
    except Exception as e:
         print(f"Failed entering public_html: {e}")
         
    ftp.quit()

if __name__ == '__main__':
    main()

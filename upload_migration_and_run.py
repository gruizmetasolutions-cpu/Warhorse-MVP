import ftplib
import urllib.request
import urllib.error

def main():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    # 1. Upload new migration file
    print("Uploading migration file...")
    local_migration = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Database\Migrations\2026-07-21-000002_Sprint6Upgrades.php"
    remote_path = 'warhorse_app/app/Database/Migrations/2026-07-21-000002_Sprint6Upgrades.php'
    with open(local_migration, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)
    print("Migration file uploaded successfully.")
    
    # 2. Upload run_migrations.php to FTP root
    print("Uploading run_migrations.php helper to FTP Root...")
    local_run = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\run_migrations.php"
    with open(local_run, 'rb') as f:
        ftp.storbinary('STOR run_migrations.php', f)
    print("run_migrations.php helper uploaded to FTP Root.")
    
    ftp.quit()
    
    # 3. Trigger run_migrations.php over HTTP
    print("Triggering migrations over HTTPS...")
    url = "https://warhorse.dataholics.com.mx/run_migrations.php"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept': 'text/html'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            print("\n--- HTTP RESPONSE ---")
            print(html)
            print("---------------------\n")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}:")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Trigger request failed: {e}")
        
    # 4. Reconnect to delete run_migrations.php
    print("Re-connecting to FTP to clean up helper...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    try:
        ftp.delete('run_migrations.php')
        print("Deleted run_migrations.php from FTP Root successfully.")
    except Exception as e:
        print(f"Failed to delete helper: {e}")
        
    ftp.quit()
    print("Process complete!")

if __name__ == '__main__':
    main()

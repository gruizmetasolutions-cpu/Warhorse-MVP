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
    
    print("Uploading db_purge.php to FTP Root...")
    local_run = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\db_purge.php"
    with open(local_run, 'rb') as f:
        ftp.storbinary('STOR db_purge.php', f)
    print("db_purge.php uploaded to FTP Root.")
    
    ftp.quit()
    
    print("Triggering purge over HTTPS...")
    url = "https://warhorse.dataholics.com.mx/db_purge.php"
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
        
    print("Re-connecting to FTP to clean up helper...")
    try:
        ftp = ftplib.FTP()
        ftp.connect(server, 21, timeout=30)
        ftp.login(user, password)
        ftp.set_pasv(True)
        
        ftp.delete('db_purge.php')
        print("Deleted db_purge.php from FTP Root successfully.")
        ftp.quit()
    except Exception as e:
        print(f"Failed to delete helper: {e}")
        
    print("Process complete!")

if __name__ == '__main__':
    main()

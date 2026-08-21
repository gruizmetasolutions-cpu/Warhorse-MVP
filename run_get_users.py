import ftplib
import urllib.request
import urllib.error
import ssl

def main():
    server = 'warhorse.dataholics.com.mx'
    user = 'warhorse_ftp@warhorse.dataholics.com.mx'
    password = 'Warhorse2026!ftp'

    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)

    print("Uploading get_users.php to FTP Root...")
    local_run = r"C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\deploy\public_html\get_users.php"
    with open(local_run, 'rb') as f:
        ftp.storbinary('STOR get_users.php', f)
    print("get_users.php uploaded to FTP Root.")
    
    ftp.quit()
    
    print("Triggering get_users.php over HTTPS...")
    url = "https://warhorse.dataholics.com.mx/get_users.php"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        # ignore ssl errors if any
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, context=ctx) as response:
            html = response.read().decode('utf-8')
            print("\n--- HTTP RESPONSE ---")
            print(html)
            print("---------------------\n")
    except Exception as e:
        print(f"Trigger request failed: {e}")
        
    print("Re-connecting to FTP to clean up helper...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    try:
        ftp.delete('get_users.php')
        print("Deleted get_users.php from FTP Root successfully.")
    except Exception as e:
        print(f"Failed to delete helper: {e}")
        
    ftp.quit()

if __name__ == '__main__':
    main()

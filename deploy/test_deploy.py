
import ftplib
ftp = ftplib.FTP('ftp.dataholics.com.mx')
ftp.login('DEV_warhorse@warhorse.dataholics.com.mx', '2k@r~mD5K.Y?')
try:
    ftp.cwd('public_html')
    with open('index_test.php', 'w') as f:
        f.write('<?php echo \'HELLO FROM CI4!\'; exit; ?>')
    with open('index_test.php', 'rb') as f:
        ftp.storbinary('STOR index.php', f)
    print('Uploaded test index.php')
except Exception as e:
    print('Error:', e)
finally:
    ftp.quit()


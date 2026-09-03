import ftplib
import os

server = 'ftp.dataholics.com.mx'
user = 'DEV_warhorse@warhorse.dataholics.com.mx'
password = '2k@r~mD5K.Y?'

ftp = ftplib.FTP()
ftp.connect(server, 21, timeout=30)
ftp.login(user, password)
ftp.set_pasv(True)

ftp.cwd('/warhorse_app/app/Controllers/Api/V1')
with open('RequisicionesController_remote.php', 'wb') as f:
    ftp.retrbinary('RETR RequisicionesController.php', f.write)

ftp.quit()

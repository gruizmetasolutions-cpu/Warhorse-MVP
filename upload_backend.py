import ftplib

def main():
    server = 'ftp.dataholics.com.mx'
    user = 'DEV_warhorse@warhorse.dataholics.com.mx'
    password = '2k@r~mD5K.Y?'
    
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    
    files_to_upload = [
        ('apps/api/app/Libraries/Permisos.php', 'warhorse_app/app/Libraries/Permisos.php'),
        ('apps/api/app/Controllers/Api/V1/RequisicionesController.php', 'warhorse_app/app/Controllers/Api/V1/RequisicionesController.php'),
        ('apps/api/app/Services/RequisicionService.php', 'warhorse_app/app/Services/RequisicionService.php'),
        ('apps/api/app/Controllers/Api/V1/ComprasController.php', 'warhorse_app/app/Controllers/Api/V1/ComprasController.php'),
        ('apps/api/app/Controllers/Api/V1/UnidadesController.php', 'warhorse_app/app/Controllers/Api/V1/UnidadesController.php'),
        ('apps/api/app/Services/DashboardService.php', 'warhorse_app/app/Services/DashboardService.php'),
        ('apps/api/app/Controllers/Api/V1/DashboardController.php', 'warhorse_app/app/Controllers/Api/V1/DashboardController.php'),
        ('apps/api/app/Models/CatalogoPiezaModel.php', 'warhorse_app/app/Models/CatalogoPiezaModel.php'),
        ('apps/api/app/Controllers/Api/V1/AlmacenController.php', 'warhorse_app/app/Controllers/Api/V1/AlmacenController.php'),
        ('apps/api/app/Controllers/Api/V1/TallerController.php', 'warhorse_app/app/Controllers/Api/V1/TallerController.php'),
        ('apps/api/app/Services/TallerService.php', 'warhorse_app/app/Services/TallerService.php'),
        ('apps/api/app/Controllers/Api/V1/OrdenesTrabajoController.php', 'warhorse_app/app/Controllers/Api/V1/OrdenesTrabajoController.php'),
        ('apps/api/app/Config/Routes.php', 'warhorse_app/app/Config/Routes.php'),
        ('apps/api/app/Controllers/ContactController.php', 'warhorse_app/app/Controllers/ContactController.php'),
        ('apps/api/app/Models/UnidadModel.php', 'warhorse_app/app/Models/UnidadModel.php'),
        ('apps/deploy/warhorse_app/app/Libraries/RespuestasApi.php', 'warhorse_app/app/Libraries/RespuestasApi.php')
    ]
    
    for local, remote in files_to_upload:
        print(f"Uploading {local} -> {remote}")
        with open(local, 'rb') as f:
            ftp.storbinary(f'STOR {remote}', f)
            
    ftp.quit()
    print("All backend files uploaded successfully.")

if __name__ == '__main__':
    main()

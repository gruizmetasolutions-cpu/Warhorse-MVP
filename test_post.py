import urllib.request
import urllib.error
import json

url = 'https://warhorse.dataholics.com.mx/api/v1/auth/login'
headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}
data = json.dumps({'email': 'direccion@warhorse.mx', 'password': 'warhorse-demo'}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers)

try:
    with urllib.request.urlopen(req) as resp:
        print("Status:", resp.status)
        print("Body:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error Status:", e.code)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)

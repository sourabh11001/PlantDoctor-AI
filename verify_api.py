import requests
import sys

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
RESET = '\033[0m'
BOLD = '\033[1m'

EXISTING_IMAGE = 'image.webp'

def test_api():
    print(f"{BOLD}Testing Plant Doctor API with {EXISTING_IMAGE}...{RESET}")
    
    url = 'http://localhost:8000/analyze-plant'
    
    try:
        with open(EXISTING_IMAGE, 'rb') as img:
            files = {'file': (EXISTING_IMAGE, img, 'image/webp')}
            response = requests.post(url, files=files)
            
        if response.status_code == 200:
            print(f"{GREEN}✅ Success! API returned 200 OK{RESET}")
            data = response.json()
            
            # Basic validation
            print(f"\n{BOLD}Response Data:{RESET}")
            print(f"Plant: {data.get('plant_name')}")
            print(f"Diagnosis: {data.get('diagnosis_status')}")
            print(f"Problem: {data.get('detected_problem', {}).get('name')}")
            
            if data.get('diagnosis_status') == 'confirmed':
                print(f"{GREEN}✅ Diagnosis Confirmed{RESET}")
            else:
                print(f"{GREEN}⚠️  Diagnosis Uncertain (Expected for some images){RESET}")
                
            return True
        else:
            print(f"{RED}❌ Failed: Status Code {response.status_code}{RESET}")
            print(f"Error: {response.text}")
            return False
            
    except FileNotFoundError:
        print(f"{RED}❌ Error: {EXISTING_IMAGE} not found in current directory.{RESET}")
        return False
    except requests.exceptions.ConnectionError:
        print(f"{RED}❌ Error: Could not connect to backend. Is uvicorn running?{RESET}")
        return False
    except Exception as e:
        print(f"{RED}❌ Unexpected Error: {e}{RESET}")
        return False

if __name__ == "__main__":
    test_api()

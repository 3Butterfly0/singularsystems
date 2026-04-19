import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api/builder/"

def test_builder_workflow():
    print("--- Starting Builder Verification ---")
    
    # 1. Create Session
    print("\n1. Creating Session...")
    resp = requests.post(f"{BASE_URL}session/", json={"platform": "intel"})
    if resp.status_code != 201:
        print(f"FAILED: Create session returned {resp.status_code}")
        print(resp.text)
        return
    
    session_data = resp.json()
    session_id = session_data['id']
    session_secret = session_data['session_secret']
    print(f"SUCCESS: Session {session_id} created with secret.")

    headers = {'X-BUILD-SESSION-SECRET': session_secret}

    # 2. Verify Unauthorized Access
    print("\n2. Testing Unauthorized Access (intentionally missing secret)...")
    resp = requests.get(f"{BASE_URL}session/{session_id}/options/?type=cpu")
    if resp.status_code == 401:
        print("SUCCESS: Blocked unauthorized request.")
    else:
        print(f"FAILED: Unauthorized request returned {resp.status_code}")

    # 3. Get Compatible CPUs
    print("\n3. Fetching Compatible CPUs...")
    resp = requests.get(f"{BASE_URL}session/{session_id}/options/?type=cpu", headers=headers)
    cpus = resp.json()
    if len(cpus) > 0:
        print(f"SUCCESS: Found {len(cpus)} compatible CPUs.")
        # Pick the first one
        selected_cpu = cpus[0]
        print(f"Selecting: {selected_cpu['name']} (ID: {selected_cpu['id']})")
    else:
        print("FAILED: No CPUs found. Did you seed the database?")
        return

    # 4. Select CPU
    print("\n4. Selecting CPU...")
    resp = requests.patch(f"{BASE_URL}session/{session_id}/select/", 
                          json={"component_type": selected_cpu['type'], "component_id": selected_cpu['id']}, 
                          headers=headers)
    if resp.status_code == 200:
        print(f"SUCCESS: CPU selected.")
    else:
        print(f"FAILED: Select CPU returned {resp.status_code}")
        print(resp.text)
        return

    # 5. Get Compatible Motherboards
    print("\n5. Fetching Compatible Motherboards (should be socket matched)...")
    resp = requests.get(f"{BASE_URL}session/{session_id}/options/?type=motherboard", headers=headers)
    mbs = resp.json()
    if len(mbs) > 0:
        print(f"SUCCESS: Found {len(mbs)} compatible motherboards.")
    else:
        print("FAILED: No motherboards found for selected CPU.")
        # Debug: list all motherboards?
        return

    # 6. Validate Session
    print("\n6. Validating Current Session...")
    resp = requests.post(f"{BASE_URL}session/{session_id}/validate/", headers=headers)
    validation = resp.json()
    if validation['valid']:
        print("SUCCESS: Session is valid.")
    else:
        print(f"WARNING: Validation failed: {validation['errors']}")

    # 7. Test Proceed to Buy (Should fail due to unauthenticated user)
    print("\n7. Testing Proceed to Buy (Expected to fail auth gate)...")
    resp = requests.post(f"{BASE_URL}session/{session_id}/proceed/", headers=headers)
    if resp.status_code == 401:
        print("SUCCESS: Correctly blocked unauthenticated purchase.")
    else:
        print(f"FAILED: Proceed to buy returned {resp.status_code}")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    try:
        test_builder_workflow()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

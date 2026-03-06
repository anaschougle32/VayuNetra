#!/usr/bin/env python
"""
Verification that the new Google Maps API key is being used
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carbon_backend.settings')
django.setup()

from django.conf import settings

print('GOOGLE MAPS API KEY UPDATE VERIFICATION')
print('=' * 50)

# Check the API key from settings
api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
print(f'API Key from settings: {api_key}')

# Check the expected new API key
expected_key = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao'
print(f'Expected new API key: {expected_key}')

# Compare the keys
if api_key == expected_key:
    print('[SUCCESS] New API key is being used!')
    print('[SUCCESS] API key matches expected value')
else:
    print('[WARNING] API key mismatch detected')
    print(f'Current: {api_key}')
    print(f'Expected: {expected_key}')

# Check if it's the old key
old_key = 'AIzaSyCwcFvh1vVe979dldumRkBnV01VU3msn30'
if api_key == old_key:
    print('[ERROR] Old API key is still being used!')
elif api_key == expected_key:
    print('[SUCCESS] New API key is active')
else:
    print('[INFO] Using different API key')

# Check environment variable
env_key = os.getenv('GOOGLE_MAPS_API_KEY')
print(f'Environment variable: {env_key}')

if env_key == expected_key:
    print('[SUCCESS] Environment variable has new API key')
elif env_key == old_key:
    print('[ERROR] Environment variable still has old API key')
else:
    print('[INFO] Environment variable has different key')

print('\n' + '=' * 50)
print('API KEY UPDATE STATUS:')

if api_key == expected_key:
    print('[OK] New Google Maps API key is active')
    print('[OK] Server is using the updated key')
    print('[OK] Trip log should work with new API key')
else:
    print('[WARNING] API key update may not be complete')
    print('[WARNING] Check .env file and server restart')

print('\nTEST URL: http://127.0.0.1:8000/employee/trip/log/')
print('The new API key should be loaded in the browser.')

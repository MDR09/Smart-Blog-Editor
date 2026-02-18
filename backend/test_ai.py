import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key loaded: {bool(api_key)}")

client = genai.Client(api_key=api_key)
print("Client created successfully")

try:
    print("Testing API call...")
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='Say hello in one sentence'
    )
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Error: {type(e).__name__}")
    print(f"Message: {str(e)}")

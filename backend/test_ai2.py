import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key loaded: {bool(api_key)}")

client = genai.Client(api_key=api_key)
print("Client created successfully")

# Try to list available models
try:
    print("\nListing available models...")
    models = client.models.list()
    for model in models:
        print(f"- {model.name}")
        if hasattr(model, 'supported_generation_methods'):
            print(f"  Methods: {model.supported_generation_methods}")
        break  # Just print first model to see format
except Exception as e:
    print(f"Error listing models: {e}")

# Try different model names
model_names_to_try = [
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-1.0-pro',
    'models/gemini-1.5-flash',
    'models/gemini-pro',
]

for model_name in model_names_to_try:
    try:
        print(f"\nTrying model: {model_name}")
        response = client.models.generate_content(
            model=model_name,
            contents='Say hello'
        )
        print(f"✓ SUCCESS with {model_name}!")
        print(f"Response: {response.text[:100]}")
        break
    except Exception as e:
        print(f"✗ Failed: {str(e)[:150]}")

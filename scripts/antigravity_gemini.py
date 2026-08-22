import os
import sys

# 1. Trigger the built-in Python antigravity easter egg (opens XKCD #353 in browser)
try:
    import antigravity
    print("[OK] Python 'antigravity' module executed (browser opened).")
except Exception as e:
    print(f"[!] Could not run antigravity module: {e}")

# 2. Query the Gemini API using the official google-genai SDK
try:
    from google import genai
    from google.genai import types

    # Fetch API key from environment variable
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\n[!] Error: GEMINI_API_KEY environment variable is missing.")
        print("    Set it via terminal: export GEMINI_API_KEY='your-key-here'")
        sys.exit(1)

    # Initialize client
    client = genai.Client(api_key=api_key)

    # Antigravity prompt
    prompt = (
        "Explain the theoretical concepts of antigravity in modern physics, "
        "including hypothetical negative mass, dark energy, and the Python easter egg."
    )

    print("\n--- Sending Prompt to Gemini ---")
    print(f"Prompt: {prompt}\n")

    # Generate response
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    print("--- Gemini Response ---")
    print(response.text)

except ImportError:
    print("\n[!] The 'google-genai' library is not installed.")
    print("    Install it by running: pip install google-genai")
except Exception as e:
    print(f"\n[!] API Error: {e}")

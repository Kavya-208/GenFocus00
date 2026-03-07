import requests
import os
from dotenv import load_dotenv
import time

load_dotenv()

NASA_API_KEY = os.getenv("NASA_API_KEY")

def fetch_nasa_image(lat, lon, date, retries=3):
    """Fetch NASA satellite image with retry logic"""
    url = "https://api.nasa.gov/planetary/earth/imagery"
    params = {
        "lat": lat,
        "lon": lon,
        "date": date,
        "dim": 0.1,
        "api_key": NASA_API_KEY
    }
    
    for attempt in range(retries):
        try:
            print(f"Fetching NASA image attempt {attempt + 1} for date {date}...")
            response = requests.get(url, params=params, timeout=60)  # 60 second timeout
            if response.status_code == 200:
                print(f"✅ Got image for {date}")
                return response.url
            else:
                print(f"❌ NASA API returned {response.status_code}")
                time.sleep(2)  # wait 2 seconds before retry
        except requests.exceptions.Timeout:
            print(f"⏰ Timeout on attempt {attempt + 1}, retrying...")
            time.sleep(3)
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(2)
    
    raise Exception(f"NASA API failed after {retries} attempts for date {date}")


def get_satellite_images(lat: float, lon: float, date1: str, date2: str):
    before_url = fetch_nasa_image(lat, lon, date1)
    after_url = fetch_nasa_image(lat, lon, date2)

    return {
        "before_url": before_url,
        "after_url": after_url,
        "lat": lat,
        "lon": lon,
        "date1": date1,
        "date2": date2
    }


def download_image_as_bytes(url: str) -> bytes:
    """Downloads image from URL and returns as bytes"""
    for attempt in range(3):
        try:
            response = requests.get(url, timeout=60)
            if response.status_code == 200:
                return response.content
        except requests.exceptions.Timeout:
            print(f"⏰ Download timeout attempt {attempt + 1}")
            time.sleep(2)
    raise Exception(f"Failed to download image after 3 attempts")
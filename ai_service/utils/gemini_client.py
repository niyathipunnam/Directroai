import os
import json
import urllib.request
import urllib.parse
import urllib.error
import base64
import asyncio
import hashlib

def _get_api_key():
    return os.getenv("GEMINI_API_KEY")

def save_bytes_to_file(image_bytes: bytes, file_path: str):
    with open(file_path, 'wb') as f:
        f.write(image_bytes)

async def generate_text(prompt: str) -> dict:
    api_key = _get_api_key()
    loop = asyncio.get_event_loop()
    
    def _generate():
        # 1. Try Gemini Text Generation First
        if api_key:
            url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}'
            data = {"contents": [{"parts": [{"text": prompt}]}]}
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
            try:
                res = urllib.request.urlopen(req)
                response_data = json.loads(res.read())
                text = response_data['candidates'][0]['content']['parts'][0]['text']
                return {"success": True, "text": text}
            except Exception as e:
                print(f"Gemini Text failed ({e}). Falling back to Pollinations Text...")
        
        # 2. Free Fallback to Pollinations AI
        try:
            fallback_url = f"https://text.pollinations.ai/{urllib.parse.quote(prompt)}?model=openai"
            req = urllib.request.Request(fallback_url, headers={'User-Agent': 'Mozilla/5.0'})
            res = urllib.request.urlopen(req)
            return {"success": True, "text": res.read().decode('utf-8')}
        except Exception as e:
            return {"success": False, "error": f"Both Gemini and Fallback failed: {str(e)}"}

    return await loop.run_in_executor(None, _generate)

async def generate_image(prompt: str, save_path: str, ref_images: list = None) -> dict:
    api_key = _get_api_key()
    loop = asyncio.get_event_loop()

    def _generate():
        # 1. Try Gemini Image Generation First
        if api_key:
            url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={api_key}'
            parts = [{"text": prompt}]
            if ref_images:
                for img_path in ref_images:
                    if img_path and os.path.exists(img_path):
                        try:
                            with open(img_path, 'rb') as f:
                                encoded = base64.b64encode(f.read()).decode('utf-8')
                            mime = "image/png" if str(img_path).lower().endswith(".png") else "image/jpeg"
                            parts.append({"inlineData": {"mimeType": mime, "data": encoded}})
                        except:
                            pass
            data = {"contents": [{"parts": parts}]}
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
            try:
                res = urllib.request.urlopen(req)
                response_data = json.loads(res.read())
                for p in response_data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
                    if 'inlineData' in p and p['inlineData'].get('data'):
                        return {"success": True, "image_bytes": base64.b64decode(p['inlineData']['data'])}
            except Exception as e:
                print(f"Gemini Image failed (Quota or API error). Falling back to Pollinations... ({e})")
        
        # 2. Robust Fallback to Pollinations AI
        seed_text = " ".join(prompt.split()[:5]).lower()
        seed = int(hashlib.md5(seed_text.encode('utf-8')).hexdigest()[:8], 16) % 100000
        
        # Candidate URLs from most specific to general
        clean_prompt = prompt.replace("\n", " ").strip()
        enhanced_prompt = (clean_prompt[:250] + ", cinematic lighting, 8k, masterpiece").strip()
        
        candidate_urls = [
            f"https://image.pollinations.ai/prompt/{urllib.parse.quote(enhanced_prompt)}?seed={seed}&nologo=true",
            f"https://image.pollinations.ai/prompt/{urllib.parse.quote(enhanced_prompt)}?seed={seed}",
            f"https://image.pollinations.ai/prompt/{urllib.parse.quote(clean_prompt[:180])}?nologo=true",
            f"https://image.pollinations.ai/prompt/{urllib.parse.quote(clean_prompt[:120])}?width=768&height=768"
        ]

        last_error = "Unknown error"
        for fallback_url in candidate_urls:
            try:
                req = urllib.request.Request(fallback_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                with urllib.request.urlopen(req, timeout=30) as res:
                    img_data = res.read()
                    if img_data and len(img_data) > 1000:
                        return {"success": True, "image_bytes": img_data}
            except Exception as e:
                last_error = str(e)
                continue

        return {"success": False, "error": f"Image generation fallback failed: {last_error}"}

    result = await loop.run_in_executor(None, _generate)
    
    if result["success"]:
        save_bytes_to_file(result["image_bytes"], save_path)
        return {"success": True, "file_path": str(save_path), "message": "Image generated successfully"}
    else:
        return result



import requests

class OllamaLLM:
    def __init__(self, model="llama3"):
        self.model = model
        self.url = "http://localhost:11434/api/generate"

    def invoke(self, prompt: str):
        response = requests.post(
            self.url,
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }
        )

        try:
            data = response.json()
            return data.get("response", "")
        except Exception as e:
            print("Ollama Error:", e)
            return ""
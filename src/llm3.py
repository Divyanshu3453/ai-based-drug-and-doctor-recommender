import google.generativeai as genai

genai.configure(api_key="")

class GeminiLLM:
    def __init__(self, model="gemini-1.5-flash"):
        self.model = genai.GenerativeModel(model)

    def generate_answer(self, query, retrieved_docs):
        context = "\n\n".join([doc["content"] for doc in retrieved_docs])

        prompt = f"""
Use ONLY the context to answer.

Context:
{context}

Question:
{query}
"""

        response = self.model.generate_content(prompt)

        return response.text
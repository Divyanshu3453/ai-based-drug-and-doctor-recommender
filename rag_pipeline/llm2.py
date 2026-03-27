import os
os.environ["OPENAI_API_KEY"] = ""
from openai import OpenAI

class OpenAILLM:
    def __init__(self, model="gpt-5"):
        self.client = OpenAI()
        self.model = model

    def generate_answer(self, query: str, retrieved_docs: list) -> str:
        # combine retrieved context
        context = "\n\n".join([doc["content"] for doc in retrieved_docs])

        response = self.client.responses.create(
            model=self.model,
            input=f"""
Use ONLY the context to answer.
If not found, say "I don't know".

Context:
{context}

Question:
{query}
"""
        )

        return response.output_text
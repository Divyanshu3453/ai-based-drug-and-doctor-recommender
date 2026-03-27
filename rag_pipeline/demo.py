import google.generativeai as genai
genai.configure(api_key="")

from data_loader import load_pdfs, split_documents
from embedding import EmbeddingManager
from vectorstore import VectorStore
from retriever import RAGretreiver
from llm3 import GeminiLLM
from rag import rag_simple


def main():
    documents = load_pdfs("../data")
    chunks = split_documents(documents)

    embedding_manager = EmbeddingManager()
    embeddings = embedding_manager.generate_embeddings_from_documents(chunks)

    vectorstore = VectorStore()
    vectorstore.add_documents(chunks, embeddings)

    retriever = RAGretreiver(vectorstore, embedding_manager)

    llm = GeminiLLM()

    query = "what is socket programming ?"
    answer = rag_simple(query, retriever, llm, top_k=5)

    print("\n--- FINAL ANSWER ---")
    print(answer)


if __name__ == "__main__":
    main()
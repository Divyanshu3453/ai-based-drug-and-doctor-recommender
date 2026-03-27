from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain_core.documents import Document



class EmbeddingManager:
    """Handles document embedding generation using SentenceTransformers"""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the sentence transformer model"""
        try:
            print(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            print(
                f"Model loaded successfully. Embedding dimension: {self.model.get_sentence_embedding_dimension()}"
            )
        except Exception as e:
            print(f"Error loading model {self.model_name}: {e}")
            raise

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts

        Args:
            texts: list of strings to embed

        Returns:
            numpy array of embeddings (len(texts), embedding_dim)
        """
        if not self.model:
            raise ValueError("Model not loaded")

        print(f"Generating embeddings for {len(texts)} texts...")
        embeddings = self.model.encode(texts, show_progress_bar=True)
        print(f"Generated embeddings with shape: {embeddings.shape}")
        return embeddings

    def generate_embeddings_from_documents(self, documents: List[Document]) -> np.ndarray:
        """
        Extract text from documents and generate embeddings
        """
        texts = [doc.page_content for doc in documents]
        return self.generate_embeddings(texts)

    def get_embedding_dimension(self) -> int:
        """Get the embedding dimension"""
        if not self.model:
            raise ValueError("Model not loaded")
        return self.model.get_sentence_embedding_dimension()
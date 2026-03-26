from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader ,PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_pdfs(pdf_directory):
    """Load all PDFs from a directory"""
    all_documents = []
    pdf_dir = Path(pdf_directory)

    pdf_files = list(pdf_dir.glob("**/*.pdf"))
    print(f"Found {len(pdf_files)} PDF files")

    for pdf_file in pdf_files:
        print(f"Processing: {pdf_file.name}")
        try:
            loader = PyPDFLoader(str(pdf_file))
            documents = loader.load()

            for doc in documents:
                doc.metadata["source_file"] = pdf_file.name
                doc.metadata["file_type"] = "pdf"

            all_documents.extend(documents)
            print(f"Loaded {len(documents)} pages")

        except Exception as e:
            print(f"Error: {e}")

    print(f"Total documents: {len(all_documents)}")
    return all_documents


def split_documents(documents, chunk_size=500, chunk_overlap=200):
    """Split documents into chunks"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )

    split_docs = text_splitter.split_documents(documents)
    print(f"Split into {len(split_docs)} chunks")

    if split_docs:
        print("\nExample chunk:")
        print(split_docs[0].page_content[:200])
        print(split_docs[0].metadata)

    return split_docs
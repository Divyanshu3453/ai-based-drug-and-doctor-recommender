def rag_simple(query, retriever, llm, top_k=5):
    # Step 1: Retrieve context
    results = retriever.retrieve(query, top_k=top_k)

    # Step 2: Extract correct content
    context_list = []

    for doc in results:
        context_list.append(doc["content"])  # ✅ FIX

    context = "\n\n".join(context_list)

    # Debug (important)
    print("\n--- CONTEXT SENT TO LLM ---\n")
    print(context[:1000])
    print("\nContext length:", len(context))

    if not context.strip():
        return "No relevant context found to answer the question."

    # Step 3: Prompt
    prompt = f"""You are a helpful assistant.

Answer the question using ONLY the context below.
Explain clearly in simple terms.

If the answer is partially present, combine information.
If not present, say "I don't know".

Context:
{context}

Question: {query}

Answer:"""

    # Step 4: Generate answer
    response = llm.generate_answer(query, results)

    return response.strip() if response else "I don't know"
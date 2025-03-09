# app/core/rag_pipeline.py
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_core.language_models import BaseLLM

class RAGPipeline:
    def __init__(self, llm_client: BaseLLM):
        self.llm_client = llm_client
        self.prompt_template = PromptTemplate(
            input_variables=["query", 
                            "product_title", 
                            "cleaned_item_description",
                            "product_categories",
                            "reviews"],
            template="""
            You are an expert product analyst. Analyze the following product details and customer reviews to provide a comprehensive summary.

            Product Details:
            - Title: {product_title}
            - Description: {cleaned_item_description}
            - Categories: {product_categories}

            Customer Reviews:
            {reviews}

            Analysis should include:

            1.  Detailed Product Feature Analysis:
                 Identify and list the top 3-5 key features, focusing on aspects related to:
                    - Ingredients and their benefits (if applicable).
                    - Functionality and performance.
                    - Design and usability.
                Please specify how each feature is relevant to the product's function.

            2.  Review Sentiment Analysis:
                 Summarize the overall sentiment of the reviews (positive, negative, or mixed).
                 Extract and highlight specific positive and negative feedback points, citing examples from the reviews.
                 focus on common themes within the reviews.

            3.  Target audience and use case:
                 Who is this product best suited for?
                 In what situations would this product be most useful?

            Return the analysis in the following structured format, providing detailed and specific information:

            -   Main selling points:
                  Feature 1: [Detailed description, explaining its relevance and benefits.]
                  Feature 2: [Detailed description, explaining its relevance and benefits.]
                  Feature3: [Detailed description, explaining its relevance and benefits.]
            -   Best for: [Specific description of the ideal user and use case, with justifications.]
            -   Review highlights:
                  Overall Sentiment: [Positive/Negative/Mixed]
                  Positive Feedback:
                     [Specific review quote or summary] - [Explanation of the positive aspect]
                     [Another specific review quote or summary] - [Explanation of the positive aspect]
                  Negative Feedback:
                     [Specific review quote or summary] - [Explanation of the negative aspect]
                     [Another specific review quote or summary] - [Explanation of the negative aspect]

Please ensure your analysis is based solely on the provided product details and customer reviews.
            """

        )
        self.chain = LLMChain(llm=self.llm_client, prompt=self.prompt_template)

    async def generate_explanation(self, query: str, product_info: dict, reviews: list) -> str:
        # Process reviews into formatted text
        review_text = "\n".join([f"- ⭐{rev['rating']}: {rev['content']}" for rev in reviews])
        
        return await self.chain.arun({
            "query": query,
            "product_title": product_info["product_title"],  # Direct keys
            "cleaned_item_description": product_info["cleaned_item_description"],
            "product_categories": product_info["product_categories"],
            "reviews": review_text  # Now properly defined
        })
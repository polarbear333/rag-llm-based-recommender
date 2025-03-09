CREATE OR REPLACE TABLE FUNCTION `amazon_dataset.product_with_reviews_search`(
  search_query STRING,
  products_k INT64,
  reviews_per_product INT64
)
RETURNS TABLE<
  product_asin STRING,
  product_title STRING,
  product_similarity FLOAT64,
  review_content STRING,
  review_rating INT64,
  review_similarity FLOAT64,
  verified_purchase BOOL
>
AS (
  WITH query_embedding AS (
    SELECT
      embedding,
      content AS query
    FROM
      ML.GENERATE_EMBEDDING(
        MODEL `amazon_dataset.Embeddings`,
        (SELECT search_query AS content)
      )
  ),
  product_results AS (
    SELECT
      base.asin,
      base.product_title,
      score AS similarity
    FROM
      VECTOR_SEARCH(
        TABLE `amazon_dataset.product_embeddings`,
        'embedding',
        (SELECT embedding FROM query_embedding),
        top_k => products_k,
        options => '{"fraction_lists_to_search": 0.01}'
      )
  ),
  relevant_reviews AS (
    SELECT
      p.asin AS product_asin,
      p.product_title,
      p.similarity AS product_similarity,
      r.base.content AS review_content,
      r.base.rating AS review_rating,
      r.score AS review_similarity,
      r.base.verified_purchase,
      ROW_NUMBER() OVER (PARTITION BY p.asin ORDER BY r.score DESC) AS review_rank
    FROM product_results p
    JOIN VECTOR_SEARCH(
        TABLE `amazon_dataset.review_embeddings`,
        'embedding',
        (SELECT embedding FROM query_embedding),
        top_k => products_k * reviews_per_product * 2,
        options => '{"fraction_lists_to_search": 0.01}'
      ) r
    ON p.asin = r.base.asin
  )
  SELECT
    product_asin,
    product_title,
    product_similarity,
    review_content,
    review_rating,
    review_similarity,
    verified_purchase
  FROM relevant_reviews
  WHERE review_rank <= reviews_per_product
  ORDER BY product_similarity DESC, review_rank ASC
);
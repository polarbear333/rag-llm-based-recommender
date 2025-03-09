CREATE OR REPLACE TABLE `amazon_dataset.product_embeddings` AS
SELECT 
  asin,
  content,
  ml_generate_embedding_result as embedding
FROM ML.GENERATE_EMBEDDING(
  MODEL `amazon_dataset.Embeddings`,
  (SELECT 
    asin,
    product_title,
    cleaned_item_description,
    product_categories,
    CONCAT(product_title, ' ', cleaned_item_description, ' ', product_categories) AS content 
   FROM `amazon_dataset.unique_products`)
);

CREATE OR REPLACE TABLE `amazon_dataset.review_embeddings` AS
SELECT 
  user_id,
  asin,
  rating,
  content,
  review_timestamp,
  verified_purchase,
  ml_generate_embedding_result as embedding
FROM ML.GENERATE_EMBEDDING(
  MODEL `amazon_dataset.Embeddings`,
  (SELECT 
    user_id,
    asin,
    rating,
    cleaned_review_text AS content,
    review_timestamp,
    verified_purchase
   FROM `amazon_dataset.unique_reviews`)
);

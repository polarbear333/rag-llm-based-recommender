-- Create unique products table with relevant fields
CREATE OR REPLACE TABLE `amazon_dataset.unique_products` AS
SELECT 
  asin,
  product_title,
  cleaned_item_description,
  product_categories,
  ARRAY_AGG(DISTINCT feature IGNORE NULLS) AS feature_list
FROM `amazon_dataset.amazon-table` AS t,
     UNNEST(t.product_features.list) AS feature_record,
     UNNEST([feature_record.element]) AS feature
WHERE cleaned_item_description IS NOT NULL
GROUP BY asin, product_title, cleaned_item_description, product_categories;

-- Create unique reviews table
CREATE OR REPLACE TABLE `amazon_dataset.unique_reviews` AS
SELECT 
  user_id,
  asin,
  rating,
  cleaned_review_text,
  review_timestamp,
  verified_purchase
FROM `amazon_dataset.amazon-table`
WHERE cleaned_review_text IS NOT NULL;


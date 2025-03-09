-- Create an index for product embeddings
CREATE OR REPLACE VECTOR INDEX `amazon_dataset.product_index`
ON `amazon_dataset.product_embeddings`(embedding)
OPTIONS (distance_type = 'COSINE', index_type = 'treeAH');

-- Create an index for review embeddings
CREATE OR REPLACE VECTOR INDEX `amazon_dataset.review_index`
ON `amazon_dataset.review_embeddings`(embedding)
OPTIONS (distance_type = 'COSINE', index_type = 'treeAH');

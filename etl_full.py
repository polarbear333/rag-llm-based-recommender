from pyspark.sql import SparkSession
from pyspark.sql.functions import col, concat_ws, lower, regexp_replace, to_timestamp, udf
from pyspark.sql.types import StringType, StructType, StructField, ArrayType, IntegerType, FloatType, BooleanType, LongType
import numpy as np
from datasets import load_dataset



# Define categories
categories = ["All_Beauty", "Software", "Baby_products"]

# Initialize Spark Session with Kryo serialization

spark = SparkSession.builder \
    .config("spark.driver.memory", "16g") \
    .config("spark.executor.memory", "5g") \
    .config("spark.memory.fraction", "0.8") \
    .config("spark.sql.shuffle.partitions", "2000") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .config("spark.kryoserializer.buffer", "64m") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .config("spark.sql.adaptive.skewJoin.enabled", "true") \
    .config("spark.sql.files.maxPartitionBytes", "128m") \
    .config("spark.default.parallelism", "200") \
    .getOrCreate()

# Add near the top of your script
spark.sparkContext.setCheckpointDir("gs://amazon-reviews-storage/checkpoints")


# --- UDF for text cleaning ---
def clean_text_udf(text):
    if text is None:
        return ""
    cleaned_text = ' '.join(filter(None, [text])).replace('\n', ' ').replace('\t', ' ').strip()
    return cleaned_text

clean_text = udf(clean_text_udf, StringType())

def convert_all_numpy(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, list):
        return [convert_all_numpy(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: convert_all_numpy(v) for k, v in obj.items()}
    else:
        return obj


def etl_category(category_name):
    """
    ETL function corrected to use 'parent_asin' for metadata and join.
    """
    print(f"Processing category: {category_name}")

    # --- Load Data ---
    print("Loading datasets...")
    reviews_pd = load_dataset("McAuley-Lab/Amazon-Reviews-2023", f'raw_review_{category_name}', split="full", trust_remote_code=True).to_pandas()
    metadata_pd = load_dataset("McAuley-Lab/Amazon-Reviews-2023", f'raw_meta_{category_name}', split="full", trust_remote_code=True).to_pandas()


    reviews_pd = reviews_pd.drop(columns=['images'])
    metadata_pd = metadata_pd.drop(columns=['subtitle', 'bought_together', 'images', 'videos', 'author'])

    reviews_pd = reviews_pd.applymap(convert_all_numpy)
    metadata_pd = metadata_pd.applymap(convert_all_numpy)

    metadata_pd['rating_number'] = metadata_pd['rating_number'].fillna(0).astype(int)
    metadata_pd['average_rating'] = metadata_pd['rating_number'].fillna(0.0).astype(float)

    # --- Define Explicit Schemas ---
    reviews_schema = StructType([
        StructField("rating", FloatType(), True),
        StructField("title", StringType(), True),
        StructField("text", StringType(), True),
        StructField("asin", StringType(), True),
        StructField("parent_asin", StringType(), True),
        StructField("user_id", StringType(), True),
        StructField("timestamp", LongType(), True),
        StructField("helpful_vote", IntegerType(), True),
        StructField("verified_purchase", BooleanType(), True)
    ])

    metadata_schema = StructType([
        StructField("main_category", StringType(), True),
        StructField("title", StringType(), True),
        StructField("average_rating", FloatType(), True),
        StructField("rating_number", IntegerType(), True),
        StructField("features", ArrayType(StringType()), True),
        StructField("description", StringType(), True),
        StructField("price", StringType(), True),
        StructField("store", StringType(), True),
        StructField("categories", StringType(), True),
        StructField("details", StringType(), True),
        StructField("parent_asin", StringType(), True),
    ])

    # --- Create Spark DataFrames ---
    print("Creating Spark DataFrames...")
    reviews_df = spark.createDataFrame(reviews_pd, schema=reviews_schema)
    metadata_df = spark.createDataFrame(metadata_pd, schema=metadata_schema)

    reviews_df = reviews_df.repartition(200, "asin")  # Increase from current partitioning
    metadata_df = metadata_df.repartition(200, "parent_asin")



    # --- Process Reviews ---
    print("Processing reviews...")
    processed_reviews = reviews_df.select(
        col("asin"),
        col("user_id"),
        col("rating").cast(IntegerType()).alias("rating"),
        col("text").alias("review_text"),
        to_timestamp(col("timestamp")/1000).alias("review_timestamp"),
        col("verified_purchase")
    ).withColumn("cleaned_review_text", clean_text(col("review_text")))

    # --- Process Metadata (Corrected to use 'parent_asin' and rename to 'asin') ---
    print("Processing metadata...")
    processed_metadata = metadata_df.select(
        col("parent_asin").alias("asin"),
        col("main_category"),
        col("title").alias("product_title"),
        col("average_rating"),
        col("rating_number"),
        concat_ws(" ",
                 col("title"),
                 col("description"),
                 concat_ws(" ", col("features"))
        ).alias("item_description"),
        col("features").alias("product_features"),
        col("categories").alias("product_categories"),
        col("details")
    ).withColumn("cleaned_item_description", clean_text(col("item_description")))


    # Then add before your join operation
    processed_reviews.checkpoint()
    processed_metadata.checkpoint()

    
    # --- Join DataFrames ---
    print("Joining datasets...")
    final_df = processed_reviews.join(
        processed_metadata,
        "asin",
        "inner"
    ).select(
        "asin",
        "user_id",
        "rating",
        "review_text",
        "cleaned_review_text",
        "review_timestamp",
        "verified_purchase",
        "main_category",
        "product_title",
        "average_rating",
        "rating_number",
        "item_description",
        "cleaned_item_description",
        "product_features",
        "product_categories",
        "details"
    )

    # --- Write to GCS ---
    output_path = f"gs://amazon-reviews-storage/processed_amazon_reviews/{category_name}"
    print(f"Writing to {output_path}")
    final_df.write \
    .partitionBy("main_category") \
    .mode("overwrite") \
    .parquet(output_path)
    print(f"Completed processing for {category_name}")
    final_df.unpersist()
    processed_reviews.unpersist()
    processed_metadata.unpersist()
    reviews_df.unpersist()
    metadata_df.unpersist()

if __name__ == "__main__":
    for category in categories:
        etl_category(category)
    spark.stop()
    print("All categories processed successfully")

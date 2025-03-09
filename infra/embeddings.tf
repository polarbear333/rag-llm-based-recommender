# embeddings.tf
resource "google_cloud_run_v2_job" "embedding_job" {
  name     = "embedding-generator"
  location = "us-west1"
  project  = var.project_id

  template {
    template {
      containers {
        image = "us-west1-docker.pkg.dev/${var.project_id}/embeddings/embedding-pipeline:latest"
        resources {
          limits = {
            cpu    = "4"
            memory = "16Gi"
          }
        }
      }
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = ["${var.project_id}:us-west1:instance-sql"]
        }
      }
    }
  }
}

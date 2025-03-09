# secrets.tf
resource "google_secret_manager_secret" "db_user" {
  secret_id = "pgvector-db-user"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "pgvector-db-password"
  
  replication {
    auto {}
  }
}

resource "random_password" "postgres" {
  length  = 16
  special = false
}

resource "google_secret_manager_secret_version" "db_user" {
  secret      = google_secret_manager_secret.db_user.id
  secret_data = "postgres"
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.postgres.result
}
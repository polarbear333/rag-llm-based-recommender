data "google_secret_manager_secret_version" "db_user_secret" {
  secret  = google_secret_manager_secret.db_user.secret_id
  version = "latest"
}

data "google_secret_manager_secret_version" "db_password_secret" {
  secret  = google_secret_manager_secret.db_password.secret_id
  version = "latest"
}

resource "google_sql_user" "db_user" {
  name     = data.google_secret_manager_secret_version.db_user_secret.secret_data
  instance = "instance-sql"
  password = data.google_secret_manager_secret_version.db_password_secret.secret_data

  deletion_policy = "ABANDON"
  type            = "BUILT_IN"
}

resource "google_sql_database" "database" {
  name     = "amazon-demo"
  instance = "instance-sql"
  # Make user owner
  depends_on = [google_sql_user.db_user]
}
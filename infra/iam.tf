# Grant Cloud Run service account access
data "google_project" "project" {}

resource "google_secret_manager_secret_iam_member" "secret_access" {
  for_each = toset([
    google_secret_manager_secret.db_user.secret_id,
    google_secret_manager_secret.db_password.secret_id
  ])
  
  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}
# versions.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.80.0"  # Required for latest Cloud Run features
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "us-west1"
}
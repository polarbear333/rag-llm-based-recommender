# Utility functions for the API project

def clean_text(text: str) -> str:
    """
    Clean the input text by removing extra spaces, newlines, and special characters.
    """
    text = " ".join(text.split())  # Remove extra spaces and newlines
    # TODO: Add more cleaning steps if needed (e.g., remove special characters)
    return text
"""
🤖 Chatbot NLU Trainer & Evaluator - Hugging Face Spaces
========================================================

A Gradio-based interface for the Chatbot NLU Trainer & Evaluator.
Optimized for Hugging Face Spaces deployment.

Author: Amarjit Kumar
Repository: https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator
"""

# Import from the main gradio app
from gradio_app import create_gradio_app

# Create and launch the app
if __name__ == "__main__":
    app = create_gradio_app()
    app.launch()

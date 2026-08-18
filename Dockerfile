# Use a slim official Python 3.12 image for the amd64 platform
FROM --platform=linux/amd64 python:3.12-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies (for building some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file for dependency install
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all app files (Python code and modules)
COPY . .

# Create cache directory for jugaad_data with correct permissions
RUN mkdir -p /root/.cache/nsehistory-stock

# Set environment variable to define cache directory for jugaad_data
ENV JUGAAD_CACHE_DIR=/root/.cache/nsehistory-stock

# Expose the app port
EXPOSE 8000

# Run FastAPI app using Gunicorn with Uvicorn workers
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]

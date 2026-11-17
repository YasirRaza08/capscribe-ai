FROM python:3.11-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Ensure storage directories exist
RUN mkdir -p data/uploads data/renders data/subtitles data/thumbnails

# Expose backend port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

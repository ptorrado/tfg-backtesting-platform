# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (gcc might be needed for some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# and install 'schedule' for the background task
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir schedule

# Copy the current directory contents into the container at /app
COPY . .

# Make the entrypoint executable
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 8000

# Define environment variable
ENV PYTHONPATH=/app

# Run entrypoint.sh when the container launches
ENTRYPOINT ["/app/entrypoint.sh"]

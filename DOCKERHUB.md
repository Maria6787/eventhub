# 🐳 Push Images to Docker Hub (Bonus)

This guide pushes the EventHub **backend** and **frontend** images to Docker Hub
with a semantic version tag (`1.0.0`) **and** a `latest` tag.

> Replace `<DOCKERHUB_USERNAME>` with your real Docker Hub username everywhere below.

---

## 1. Log in to Docker Hub
```bash
docker login
# enter your Docker Hub username and password/access token when prompted
```

## 2. Build the images (if not built yet)
```bash
cd eventhub
docker compose build
```

## 3. Tag the images (version 1.0.0 + latest)
Docker Compose named the images `eventhub-backend` and `eventhub-frontend`.
We re-tag them under your Docker Hub namespace with TWO tags each:

```bash
# --- Backend ---
docker tag eventhub-backend <DOCKERHUB_USERNAME>/eventhub-backend:1.0.0
docker tag eventhub-backend <DOCKERHUB_USERNAME>/eventhub-backend:latest

# --- Frontend ---
docker tag eventhub-frontend <DOCKERHUB_USERNAME>/eventhub-frontend:1.0.0
docker tag eventhub-frontend <DOCKERHUB_USERNAME>/eventhub-frontend:latest
```

> 💡 Why two tags? `1.0.0` is an immutable, specific version (reproducible),
> while `latest` is a moving pointer to the newest build (convenient to pull).

## 4. Push all tags to Docker Hub
```bash
# --- Backend ---
docker push <DOCKERHUB_USERNAME>/eventhub-backend:1.0.0
docker push <DOCKERHUB_USERNAME>/eventhub-backend:latest

# --- Frontend ---
docker push <DOCKERHUB_USERNAME>/eventhub-frontend:1.0.0
docker push <DOCKERHUB_USERNAME>/eventhub-frontend:latest
```

## 5. Verify
Open your Docker Hub profile in a browser:
```
https://hub.docker.com/u/<DOCKERHUB_USERNAME>
```
You should see both repositories, each showing the `1.0.0` and `latest` tags.

## 6. (Optional) Pull & run from Docker Hub on any machine
Proves the image is portable — anyone can now run your app without the source:
```bash
docker pull <DOCKERHUB_USERNAME>/eventhub-backend:1.0.0
docker pull <DOCKERHUB_USERNAME>/eventhub-frontend:1.0.0
```

---

### 📸 Screenshot for the PDF (Bonus section)
Take a screenshot of:
- The terminal output of a successful `docker push`, **and/or**
- Your Docker Hub web page showing both repos with the `1.0.0` + `latest` tags.

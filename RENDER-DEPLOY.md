# Deploy the frontend on Render

Create a Static Site from this repository and select **Blueprint** to use `render.yaml`.

Set `VITE_API_BASE_URL` to the deployed backend's public URL followed by `/api`, for example `https://your-backend.onrender.com/api`. This variable is used during the frontend build; changing it requires a new deploy.

The backend must allow the deployed frontend's exact HTTPS origin in its `CORS_ALLOWED_ORIGINS` environment variable. Configure that origin without a path, for example `https://your-frontend.onrender.com`.

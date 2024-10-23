# Task Queue with Clustering, Redis, and Rate Limiting

This project is an Express.js server that uses clustering to scale across multiple CPU cores, Redis for queuing tasks with the `bull` library, and rate limiting to control the number of API requests from users. The server processes user tasks in the background and logs task completions.

## Features:
- **Task Queueing**: Tasks are added to a Redis-backed queue using Bull, allowing background processing of user tasks.
- **Clustering**: The server runs multiple worker processes, maximizing the usage of system CPU cores.
- **Rate Limiting**: Requests are rate-limited to 1 request per second per user, with an additional limit of 20 requests per minute.
- **Task Logging**: Each completed task is logged to a file with a timestamp.
- **Graceful Worker Handling**: Workers are automatically restarted if they crash.

## Prerequisites:
- Node.js and npm installed
- Redis server (either local or hosted)
- Environment variables set up in a `.env` file

## Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/YourUsername/YourRepoName.git
    cd YourRepoName
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Create a `.env` file** in the root of your project and add the following environment variables:

    ```
    REDIS_HOST=your-redis-host
    REDIS_PORT=your-redis-port
    REDIS_PASSWORD=your-redis-password
    ```

4. **Start the server**:
    ```bash
    npm start
    ```

## Usage

- The server will start on `http://localhost:8000`.
- **Add a task**: 
    Send a POST request to `http://localhost:8000/api/v1/task` with a JSON body containing a `user_id`:

    ```json
    {
      "user_id": "user123"
    }
    ```

- **Kill a worker** (for testing cluster behavior):
    Send a GET request to `http://localhost:8000/kill`.

- **Rate Limiting**: 
    - Users are limited to 1 request per second.
    - Users can make a maximum of 20 requests per minute.

## Task Queue Processing

Tasks submitted through the API are added to a Redis-backed queue. Worker processes will pick tasks from the queue and process them asynchronously.

### Example API Request

Use **Postman** or **cURL** to send requests:

```bash
curl -X POST http://localhost:8000/api/v1/task \
-H "Content-Type: application/json" \
-d '{"user_id": "user123"}'

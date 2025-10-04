# Inngest: Complete Guide

## 1. What is Inngest?

Inngest is a **serverless event-driven workflow platform**.

- Acts as a **background workflow orchestrator** for your applications.
- Lets your servers **emit events**, which trigger workflows **without blocking your main server**.
- Manages retries, scheduling, and scaling automatically.

**Use cases:**

- Sending emails on signup
- AI ticket analysis
- Notifications
- Any background processing that should not block main server

---

## 2. Serverless Architecture

- **Serverless** means: You don’t manage any infrastructure for running workflows.
- Inngest **runs your functions on demand**, scales automatically, and charges only for execution.
- Your main server stays free from heavy background tasks.

**Analogy:**

- Main server = restaurant taking orders
- Inngest = automated kitchen that cooks orders in the background
- You don’t need extra staff or infrastructure; it scales automatically

---

## 3. Core Concepts

### 3.1 Functions

```js
const sendWelcome = inngest.createFunction(
  { id: 'send-welcome-email' },
  { event: 'user.signup' },
  async ({ event }) => {
    await sendMail(event.data.email);
  }
);
```

- `id`: Unique identifier for the function (stable, internal)
- `name`: Optional, human-friendly label
- `event`: The event name the function listens to
- Function runs when the event is emitted, asynchronously

### 3.2 Events

```js
await inngest.send({ name: 'user.signup', data: { email: 'sam@example.com' } });
```

- Events are emitted from any server.
- Functions subscribed to the event are triggered.
- `await` only waits until the event is delivered to Inngest, not until the function finishes.

### 3.3 serve() Middleware

```js
import { serve } from 'inngest/express';
app.use('/api/inngest', serve(inngest, [sendWelcome]));
```

- Exposes your Inngest functions as an HTTP endpoint.
- In production, Inngest Cloud calls this endpoint to run your functions.
- In local dev, `inngest dev` simulates the cloud locally.

---

## 4. Flow of Events and Functions

### Step-by-Step Flow

- Define function → `createFunction` (e.g., Notification Service)
- Expose endpoint → `app.use('/api/inngest', serve(...))`
- Emit event → `inngest.send({ name: 'user.signup', data })` (e.g., Auth Service)
- Inngest Cloud picks up the event → calls `/api/inngest` on Notification Service
- Function runs asynchronously → processes the event

---

## 5. Development vs Production

### 🛠 Development

- Run `npx inngest dev`.
- This starts the Inngest Dev Server locally.
- The dev server opens a tunnel between Inngest Cloud ↔ your localhost.
- When you emit an event:

  - Event goes to Inngest Cloud.
  - Cloud forwards it via the tunnel → your local `/api/inngest`.
  - Function runs on your own machine.

👉 Useful because you can test real Cloud behavior while keeping code running locally.

### 🚀 Production

- Deploy your app (e.g., Vercel, AWS, Render).
- Inngest Cloud can now directly reach your `/api/inngest` endpoint (no tunnel).
- When you emit an event:

  - Event is stored in Inngest Cloud.
  - Cloud calls your deployed function endpoint.
  - Function runs serverlessly; retries, scheduling, scaling all handled for you.

👉 Helpful because your main server is free from background jobs, you don’t need workers, and you only pay per execution.

### ⚡ Key Difference

- **Dev**: Cloud → tunnel → localhost → function runs on your computer.
- **Prod**: Cloud → HTTPS call → deployed serverless function → function runs in cloud infra.

---

## 6. Microservices and Event-Driven Architecture

- Multiple services can share the same Inngest app via `INNGEST_API_KEY`.
- Service A can emit events; Service B can subscribe to them.
- Inngest Cloud acts as the central broker, decoupling services.

**Example:**

- Auth Service emits → Inngest Cloud → Notification Service function runs

---

## 7. Comparison with Queues and Workers

| Feature              | BullMQ / RabbitMQ / Kafka                           | Inngest                                                      |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Setup                | Need Redis / broker & worker processes              | No infra, serverless                                         |
| Event vs Job         | Jobs pushed to queues, workers pick them            | Events emitted, functions subscribe                          |
| Scaling              | Manual: add workers, manage infra                   | Auto-scaling, serverless                                     |
| Retries / Scheduling | Manual config                                       | Built-in retries, backoff, delayed steps                     |
| Developer Experience | Boilerplate, manual orchestration                   | Simple, code-like workflow definitions                       |
| Multi-server         | Workers must subscribe to queue                     | Services just connect to same API key, cloud handles routing |
| Async behavior       | Workers run jobs, may block if not properly handled | Always async, non-blocking, orchestrated by cloud            |

---

## 8. Key Takeaways

- `inngest.send()` = emit event → quick, non-blocking.
- `createFunction()` = define workflow for a specific event.
- `serve()` = expose function endpoint to be called by Inngest Cloud or dev server.
- `id` = function identifier, stable; `name` = human-friendly label.
- Local dev = everything handled by `inngest dev`.
- Production = cloud sends HTTP requests to your servers asynchronously.

---

## 9. Mental Models

- Inngest = event hub + workflow runner in cloud
- Your servers = emitters + function hosts
- Event-driven microservices = decoupled, scalable, async
- Async flow = your API emits event → Inngest runs functions → your API doesn’t wait

---

## 10. Summary Diagram (Flow)

```
[Client/API request]
       |
       v
[Your Server emits event]
       |
       v
   (Dev) [Inngest Cloud → Tunnel → Localhost /api/inngest]
   (Prod) [Inngest Cloud → HTTPS → Deployed /api/inngest]
       |
       v
[Function runs asynchronously]
```

**Example:**

- Auth Service emits → Inngest Cloud → Notification Service processes function

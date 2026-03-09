const post = {
  id:        4,
  slug:      'signaldock-mqtt-iot',
  title:     'SignalDock: Containerised MQTT Messaging with Docker',
  category:  'project',
  emoji:     '📡',
  color:     '#a855f7',
  date:      '2026-03-08',
  readTime:  '10 min',
  tags:      ['MQTT', 'Docker', 'IoT', 'Python', 'Mosquitto', 'Pub-Sub'],
  githubUrl: 'https://github.com/Nishan052/SignalDock',
  excerpt:   'A modular, Docker-compose-based MQTT system demonstrating reliable publish-subscribe messaging between containerised IoT clients via a centralised Mosquitto broker.',

  content: `
## Overview

**SignalDock** is a lightweight IoT messaging sandbox built on the **MQTT protocol** — the de facto standard for machine-to-machine communication in IoT environments. The project containerises a complete publish-subscribe topology using Docker, making it fully portable and reproducible on any machine with Docker installed.

---

## What Problem Does It Solve?

IoT systems often involve heterogeneous devices (sensors, actuators, edge computers) that must communicate efficiently over low-bandwidth, high-latency networks. REST APIs are too heavy; WebSockets are too stateful. MQTT's lightweight pub-sub model is the industry standard answer.

---

## System Architecture

\`\`\`mermaid
flowchart TD
    subgraph mqtt-net
        B[Mosquitto Broker\nPort 1883]
        CA[Client Alpha\nPython MQTT Client]
        B <--> CA
    end
    subgraph external-net
        CB[Client Bravo\nConnects via host IP]
    end
    CB -- "TCP :1883" --> B
    P[mosquitto_pub CLI] -- "publish common/topic" --> B
    S[mosquitto_sub CLI] -- "subscribe common/topic" --> B
\`\`\`

---

## Key Components

### Mosquitto Broker
The **Eclipse Mosquitto** broker is the message hub. All clients connect to it and publish/subscribe to named **topics** (e.g. \`common/topic\`). The broker is stateless per message — it routes, does not store.

### Client Alpha (Internal Network)
Client Alpha connects via Docker's internal \`mqtt-net\` network, using the broker's container hostname directly. This simulates an on-premises edge device on the same local network as the broker.

### Client Bravo (External Network)
Client Bravo connects via the host machine's IP address, simulating a remote device reaching the broker over an external network.

---

## Design Decisions

### Why Docker Compose?
Docker Compose lets the entire topology (broker + multiple clients) be defined declaratively in a single YAML file and brought up with one command. This eliminates environment-specific configuration drift.

### Why MQTT over REST/WebSocket?
| Feature | MQTT | REST | WebSocket |
|---------|------|------|-----------|
| Overhead | < 2 bytes header | KB+ per request | Medium |
| Connection model | Persistent | Request/response | Persistent |
| Fan-out (1→N) | Native (pub-sub) | Manual polling | Manual |
| QoS levels | 0, 1, 2 | None built-in | None |

---

## Message Flow

\`\`\`mermaid
sequenceDiagram
    participant A as Client Alpha
    participant B as Mosquitto Broker
    participant C as Client Bravo
    A->>B: CONNECT
    C->>B: CONNECT (via host IP)
    A->>B: SUBSCRIBE common/topic
    C->>B: SUBSCRIBE common/topic
    A->>B: PUBLISH "Hello from Alpha"
    B->>A: MESSAGE (loopback)
    B->>C: MESSAGE "Hello from Alpha"
    C->>B: PUBLISH "Ack from Bravo"
    B->>A: MESSAGE "Ack from Bravo"
\`\`\`

---

## How to Recreate

\`\`\`bash
git clone https://github.com/Nishan052/SignalDock && cd SignalDock
docker build -t clientalpha ./clientalpha
docker build -t clientbravo ./clientbravo
docker-compose -f docker-compose.alpha.yml up -d
HOST_IP=$(ipconfig getifaddr en0)
BROKER_IP=$HOST_IP docker-compose -f docker-compose.bravo.yml up -d
\`\`\`
`,

  references: [
    { text: 'OASIS (2019) MQTT Version 5.0 Specification.', url: 'https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html' },
    { text: 'Light, R.A. (2017) "Mosquitto: server and client implementation of the MQTT protocol", Journal of Open Source Software, 2(13), p. 265.', url: 'https://doi.org/10.21105/joss.00265' },
    { text: 'Merkel, D. (2014) "Docker: Lightweight Linux containers for consistent development and deployment", Linux Journal, 2014(239), p. 2.' },
  ],
};

export default post;

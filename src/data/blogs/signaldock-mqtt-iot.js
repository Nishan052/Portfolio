const post = {
  id:        4,
  slug:      'signaldock-mqtt-iot',
  title:     'SignalDock: Containerized MQTT Messaging with Docker',
  category:  'project',
  iconKey:   'Radio',
  color:     '#a855f7',
  date:      '2026-03-08',
  readTime:  '10 min',
  tags:      ['MQTT', 'Docker', 'IoT', 'Python', 'Mosquitto', 'Pub-Sub'],
  githubUrl: 'https://github.com/Nishan052/SignalDock',
  excerpt:   'A Docker Compose setup I built where MQTT clients on two different networks talk to each other through one Mosquitto broker.',

  content: `
## What SignalDock is

For my master's I built SignalDock, a small IoT messaging sandbox on MQTT, the de facto standard for machine-to-machine communication in IoT. The whole publish-subscribe setup runs in Docker, so it's portable and runs the same way on any machine with Docker.

---

## The problem it solves

IoT systems mix different devices like sensors, actuators and edge computers, which all have to talk efficiently over low-bandwidth, high-latency networks. For that, REST APIs are too heavy and WebSockets keep too much state, so MQTT's lightweight pub-sub model is the industry standard answer.

---

## System architecture

\`\`\`mermaid
flowchart TD
    subgraph mqtt-net
        B[Mosquitto Broker
Port 1883]
        CA[Client Alpha
Python MQTT Client]
        B <--> CA
    end
    subgraph external-net
        CB[Client Bravo
Connects via host IP]
    end
    CB -- "TCP :1883" --> B
    P[mosquitto_pub CLI] -- "publish common/topic" --> B
    S[mosquitto_sub CLI] -- "subscribe common/topic" --> B
\`\`\`

---

## Key components

### Mosquitto broker
The Eclipse Mosquitto broker is the message hub, so every client connects to it and publishes or subscribes to named topics like \`common/topic\`. It's stateless per message, a bit like a sorting desk at a post office, since it routes each message on and doesn't keep it.

### Client Alpha on the internal network
Client Alpha connects through Docker's internal \`mqtt-net\` network using the broker's container hostname, which simulates an on-premises edge device on the broker's local network.

### Client Bravo on the external network
Client Bravo connects through the host machine's IP address instead, which simulates a remote device reaching the broker over an external network.

---

## Design decisions

### Docker Compose
Docker Compose describes the whole setup, the broker and all the clients, in one YAML file that comes up with one command, so the configuration can't drift between machines.

### MQTT over REST and WebSocket
| Feature | MQTT | REST | WebSocket |
|---------|------|------|-----------|
| Overhead | < 2 bytes header | KB+ per request | Medium |
| Connection model | Persistent | Request/response | Persistent |
| Fan-out (1→N) | Native (pub-sub) | Manual polling | Manual |
| QoS levels | 0, 1, 2 | None built-in | None |

---

## Message flow

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

## How to recreate it

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

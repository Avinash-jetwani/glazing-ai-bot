# Glazing AI Chat Widget

A sophisticated AI-powered chat widget for GlazingAI, providing real-time assistance to website visitors about energy-efficient window products.

## Features

- Real-time chat interface with AI-powered responses
- WebSocket-based communication for instant messaging
- Token streaming for natural typing effect
- OpenAI integration with GlazingAI product knowledge
- Toggleable fake/real AI modes for development and testing
- Easily embeddable in any website

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/lead-bot-one.git
cd lead-bot-one

# Start the infrastructure
docker-compose up -d

# Install widget dependencies
cd apps/widget
npm install
```

## Usage

```bash
# Run the widget development server
cd apps/widget
npm run dev

# Open the demo page (port may vary, check terminal output)
open http://localhost:5174/demo
```

## Project Structure

```
lead-bot-one/
├── apps/
│   ├── api/             # FastAPI backend service
│   │   ├── prompts/     # System prompts for LLM
│   │   └── main.py      # Main FastAPI application
│   └── widget/          # React widget frontend
│       ├── public/      # Static assets and demo page
│       └── src/         # React components and hooks
├── docker-compose.yml   # Docker configuration
└── PHASES.md            # Detailed development phases
```

## Project Phases

This project is being developed in phases:

- ✅ **Phase A**: Foundation - Repository, Docker, Infrastructure
- ✅ **Phase B**: Widget Static UI - React Components, Tailwind CSS
- ✅ **Phase C**: WebSocket Echo - Real-time Messaging
- ✅ **Phase D**: LLM Integration - OpenAI and Token Streaming

For detailed information about each phase including implementation details, testing instructions, and technical notes, please see [PHASES.md](PHASES.md).

## Development

See the [TESTING.md](TESTING.md) file for testing procedures for all components.

For LLM testing:
```bash
# Switch to fake LLM mode (no API costs)
docker-compose exec api sh -c "sed -i 's/USE_FAKE_LLM=false/USE_FAKE_LLM=true/g' /app/.env"
docker-compose restart api

# Switch to real OpenAI mode (requires API key)
docker-compose exec api sh -c "sed -i 's/USE_FAKE_LLM=true/USE_FAKE_LLM=false/g' /app/.env"
docker-compose restart api
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

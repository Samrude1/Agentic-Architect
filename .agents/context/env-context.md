# Environment Variables & Secrets Context

## Required Environment Variables

| Variable Name | Required | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Connection string for the primary database | `postgres://user:pass@localhost:5432/db` |
| `OPENAI_API_KEY` | Yes | API key for high-tier models (GPT-4o) | `sk-...` |
| `ANTHROPIC_API_KEY` | Yes | API key for high-tier models (Claude 3.5 Sonnet) | `sk-ant-...` |
| `GEMINI_API_KEY` | Yes | API key for fast/cheap testing models (Gemini Flash) | `AIza...` |
| `AWS_ACCESS_KEY_ID` | Yes | AWS credentials for SQS / Lambda | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS credentials for SQS / Lambda | `...` |
| `AWS_REGION` | Yes | AWS region for services | `eu-north-1` |
| `SQS_QUEUE_URL` | Yes | URL for the agent orchestration queue | `https://sqs.eu-north-1.amazonaws.com/...` |

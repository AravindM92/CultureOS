# Overview of CultureOS - Your Friendly AI Culture Assistant

This app is built on top of [Teams AI library V2](https://aka.ms/teams-ai-library-v2). 
It showcases CultureOS, a friendly AI colleague that automatically detects celebration moments, manages team culture, and coordinates work-from-office schedules using Groq Cloud's fast inference models.

> **📋 DESIGN VALIDATION**: See `DESIGN-PRINCIPLES-VALIDATION-REPORT.md` for complete validation of all 6 design principles across documentation and implementation (✅ 83% complete)

## Get started with the template

> **Prerequisites**
>
> To run the template in your local dev machine, you will need:
>
> - [Node.js](https://nodejs.org/), supported versions: 20, 22.
> - [Microsoft 365 Agents Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) latest version or [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli).
> - An account with [Groq Cloud](https://groq.com/) and an API key.

> For local debugging using Microsoft 365 Agents Toolkit CLI, you need to do some extra steps described in [Set up your Microsoft 365 Agents Toolkit CLI for local debugging](https://aka.ms/teamsfx-cli-debugging).

1. First, select the Microsoft 365 Agents Toolkit icon on the left in the VS Code toolbar.
1. In file *env/.env.playground.user*, fill in your Groq API key `SECRET_GROQ_API_KEY=<your-key>` and optionally set your preferred model `GROQ_MODEL_NAME=llama-3.1-70b-versatile`.
1. Press F5 to start debugging which launches your app in Microsoft 365 Agents Playground using a web browser. Select `Debug in Microsoft 365 Agents Playground`.
1. You can send any message to get a response from the agent.

**Congratulations**! You are running Thun.ai that can now interact with users in Microsoft 365 Agents Playground:

![ai chat agent](https://github.com/user-attachments/assets/984af126-222b-4c98-9578-0744790b103a)

## What's included in the template

| Folder       | Contents                                            |
| - | - |
| `.vscode`    | VSCode files for debugging                          |
| `appPackage` | Templates for the application manifest        |
| `env`        | Environment files                                   |
| `infra`      | Templates for provisioning Azure resources          |
| `src`        | The source code for the application                 |

The following files can be customized and demonstrate an example implementation to get you started.

| File                                 | Contents                                           |
| - | - |
|`src/index.js`| Application entry point. |
|`src/config.js`| Defines the environment variables.|
|`src/app/instructions.txt`| Defines the prompt.|
|`src/app/app.js`| Handles business logics for Thun.ai.|

The following are Microsoft 365 Agents Toolkit specific project files. You can [visit a complete guide on Github](https://github.com/OfficeDev/TeamsFx/wiki/Teams-Toolkit-Visual-Studio-Code-v5-Guide#overview) to understand how Microsoft 365 Agents Toolkit works.

| File                                 | Contents                                           |
| - | - |
|`m365agents.yml`|This is the main Microsoft 365 Agents Toolkit project file. The project file defines two primary things:  Properties and configuration Stage definitions. |
|`m365agents.local.yml`|This overrides `m365agents.yml` with actions that enable local execution and debugging.|
|`m365agents.playground.yml`|This overrides `m365agents.yml` with actions that enable local execution and debugging in Microsoft 365 Agents Playground.|

## Groq Cloud Integration

This template uses Groq Cloud for fast inference with open-source language models. Groq offers:

- **Ultra-fast inference**: Groq's hardware provides significantly faster response times compared to traditional cloud services
- **Open-source models**: Access to models like Llama 3.1, Mixtral, and Gemma
- **Cost-effective**: Competitive pricing for AI model inference
- **High throughput**: Optimized for real-time applications

### Available Models

The template is configured to use `llama-3.1-70b-versatile` by default, but you can choose from:

- `llama-3.1-405b-reasoning` - Largest model for complex reasoning tasks
- `llama-3.1-70b-versatile` - Balanced performance and capability
- `llama-3.1-8b-instant` - Fastest responses for simple tasks
- `mixtral-8x7b-32768` - Excellent for multilingual tasks
- `gemma2-9b-it` - Google's efficient model

To change the model, update the `GROQ_MODEL_NAME` environment variable in your `.env.playground.user` file.

## Extend the template

To extend Thun.ai with more AI capabilities, explore [Teams AI library V2 documentation](https://aka.ms/m365-agents-toolkit/teams-agent-extend-ai).

## Additional information and references

- [Microsoft 365 Agents Toolkit Documentations](https://docs.microsoft.com/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
- [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)
- [Microsoft 365 Agents Toolkit Samples](https://github.com/OfficeDev/TeamsFx-Samples)

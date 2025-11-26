# Discord Bot - Diva

## Overview
Um bot de Discord brasileiro com IA integrada, construído com discord.js e OpenAI.

## Comandos
- `!ask <pergunta>` - Pergunte qualquer coisa para a IA
- `!clear` - Limpar seu histórico de conversa
- `!ping` - Verificar se o bot está respondendo
- `!hello` - Receber uma saudação
- `!help` - Mostrar todos os comandos

Você também pode mencionar o bot para conversar diretamente!

## Estrutura do Projeto
- `src/index.js` - Lógica principal do bot e comandos
- `src/discord.js` - Configuração do cliente Discord
- `src/openai.js` - Integração com a IA (OpenAI)

## Configuração
O bot usa os seguintes secrets:
- `DISCORD_BOT_TOKEN` - Token do bot Discord
- `OPENAI_API_KEY` - Chave da API OpenAI

## Executando o Bot
O bot roda automaticamente via workflow "Discord Bot" usando `npm start`.

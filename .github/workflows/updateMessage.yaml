name: updateMessage

on:
  workflow_dispatch:
  schedule:
    - cron: '0 * * * *'

jobs:
  obfuscate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: node

      - name: Install dependencies
        run: npm install

      - name: Obfuscate code
        run: node tg.js

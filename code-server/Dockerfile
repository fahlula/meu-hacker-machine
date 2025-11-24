FROM codercom/code-server:latest

USER root

# Install Node.js and TypeScript globally
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g typescript ts-node @types/node

# Install VS Code extensions
RUN code-server --install-extension dbaeumer.vscode-eslint && \
    code-server --install-extension esbenp.prettier-vscode && \
    code-server --install-extension ms-vscode.vscode-typescript-next

# Switch back to coder user
USER coder

# Set working directory
WORKDIR /home/coder/project

# Copy workspace template
COPY --chown=coder:coder workspace /home/coder/project

# Install workspace dependencies
RUN npm install

# Expose port
EXPOSE 8080

# Start code-server with solution.ts open and minimal UI
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "/home/coder/project/solution.ts"]

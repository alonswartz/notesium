# Use Node.js LTS version as the base image for the application build stage
FROM node:lts-bookworm AS app-builder

# Copy Golang from a secondary Golang image to have the Go environment ready
COPY --from=golang:bookworm /usr/local/go/ /usr/local/go/

# Set up the PATH environment variable to include Go's binary directory
ENV PATH="/usr/local/go/bin:${PATH}"

# Set the working directory to /notesium in the container
WORKDIR /notesium

# Copy all project files from the host into the /notesium directory
COPY . /notesium/

# Install Tailwind CSS globally, required for frontend styling
RUN npm install -g tailwindcss

# Execute the make.sh script to build the frontend assets located in web/app
RUN ./web/app/make.sh all

# Build the Go application with version and build time metadata
RUN go build -ldflags "-X main.gitversion=$(git describe --tags --long --always --dirty) \
                        -X main.buildtime=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Start a new, minimal Node.js-based stage for the final application image
FROM node:lts-bookworm-slim AS final

# Define environment variables for versions and user settings
## Gosu version for privilege management
## Tini version for init process
## User ID for notesium user
## Group ID for notesium user
## Username for notesium user
## Directory for notesium data storage

ENV GOSU_VERSION=1.17 \
    TINI_VERSION=v0.19.0 \
    UID=1000 \
    GID=1000 \
    USERNAME=notesium \
    NOTESIUM_DIR=/notesium/data  

# Install essential tools and verify signatures for security
RUN set -eux; \
    # Save a list of currently installed packages for later cleanup
        savedAptMark="$(apt-mark showmanual)"; \
        apt-get update; \
        apt-get install -y --no-install-recommends ca-certificates gnupg wget; \
        rm -rf /var/lib/apt/lists/*; \
        \
    # Install Gosu for executing commands as a different user
        dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
        wget -q -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch"; \
        wget -q -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc"; \
        export GNUPGHOME="$(mktemp -d)"; \
        gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
        gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu; \
        gpgconf --kill all; \
        rm -rf "$GNUPGHOME" /usr/local/bin/gosu.asc; \
        chmod +x /usr/local/bin/gosu; \
        gosu --version; \
        gosu nobody true; \
        \
    # Install Tini for proper process handling within Docker
        : "${TINI_VERSION:?TINI_VERSION is not set}"; \
        dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
        echo "Downloading Tini version ${TINI_VERSION} for architecture ${dpkgArch}"; \
        wget -q -O /usr/bin/tini "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-$dpkgArch"; \
        wget -q -O /usr/bin/tini.asc "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-$dpkgArch.asc"; \
        export GNUPGHOME="$(mktemp -d)"; \
        gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys 595E85A6B1B4779EA4DAAEC70B588DFF0527A9B7; \
        gpg --batch --verify /usr/bin/tini.asc /usr/bin/tini; \
        gpgconf --kill all; \
        rm -rf "$GNUPGHOME" /usr/bin/tini.asc; \
        chmod +x /usr/bin/tini; \
        echo "Tini version: $(/usr/bin/tini --version)"; \
        \
    # Clean up apt cache to reduce the final image size
        apt-mark auto '.*' > /dev/null; \
        [ -z "$savedAptMark" ] || apt-mark manual $savedAptMark; \
        apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false

# Copy the compiled notesium binary from the app-builder stage to /usr/bin
COPY --from=app-builder --chown=1000:1000 /notesium/notesium /usr/bin/notesium

# Copy the custom startup script for Docker entry into /usr/bin
COPY start-docker.sh /usr/bin/start-docker

# Create the data directory where application data will be stored
RUN mkdir -p /notesium/data

# Define /notesium/data as a Docker volume, making it easier to persist data
VOLUME [ "/notesium/data" ]

# Set Tini as the entrypoint to ensure proper process handling
ENTRYPOINT [ "tini", "--", "start-docker" ]

# Set the default command to start notesium in writable mode on host 0.0.0.0 and port 8080
CMD [ "notesium", "web", "--writable", "--host=0.0.0.0","--port=8080" ]

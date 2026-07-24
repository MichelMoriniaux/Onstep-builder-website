# OnStep firmware build runner.
# Bakes in arduino-cli + ESP32 core 2.0.17 + all OnStepX/SWS libraries + source caches,
# so a build at runtime only needs to checkout a ref, inject configs and compile.
#
# Build:  docker build -t onstep-builder-runner ./runner
FROM debian:bookworm-slim

ARG ARDUINO_CLI_VERSION=1.1.1
ARG ESP32_CORE_VERSION=2.0.17
ARG ESP32_INDEX_URL=https://dl.espressif.com/dl/package_esp32_index.json

ENV DEBIAN_FRONTEND=noninteractive \
    ARDUINO_DIRECTORIES_DATA=/opt/arduino/data \
    ARDUINO_DIRECTORIES_USER=/opt/arduino/user \
    ARDUINO_DIRECTORIES_DOWNLOADS=/opt/arduino/downloads \
    SOURCES=/opt/sources \
    PATH=/usr/local/bin:$PATH

# Toolchain + runtime deps (python3 is used by the esp32 core tools and by build.sh).
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl git python3 python3-pip unzip xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Python modules the esp32 core's bundled esptool.py imports at runtime.
RUN pip3 install --no-cache-dir --break-system-packages \
        pyserial cryptography ecdsa reedsolo bitstring

# arduino-cli (pinned).
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh \
      | BINDIR=/usr/local/bin sh -s ${ARDUINO_CLI_VERSION} \
    && arduino-cli version

# ESP32 core.
RUN arduino-cli config init --additional-urls ${ESP32_INDEX_URL} \
    && arduino-cli core update-index \
    && arduino-cli core install esp32:esp32@${ESP32_CORE_VERSION} \
    && arduino-cli core list

# Libraries (union of both firmwares' needs).
COPY libraries.onstepx.txt libraries.sws.txt install-libs.sh /opt/runner/
RUN chmod +x /opt/runner/install-libs.sh \
    && /opt/runner/install-libs.sh /opt/runner/libraries.onstepx.txt /opt/runner/libraries.sws.txt

# Source caches (full clones so any user-supplied ref/commit can be checked out).
RUN mkdir -p ${SOURCES} \
    && git clone https://github.com/hjd1964/OnStepX.git         ${SOURCES}/OnStepX \
    && git clone https://github.com/hjd1964/SmartWebServer.git  ${SOURCES}/SmartWebServer \
    && git clone https://github.com/hjd1964/OnStepX-Plugins.git ${SOURCES}/OnStepX-Plugins

COPY build.sh /opt/runner/build.sh
RUN chmod +x /opt/runner/build.sh

# Non-root. Owns everything it may need to read or refresh (git fetch into caches copies).
RUN useradd --create-home --uid 10001 builder \
    && mkdir -p /work /in /out \
    && chown -R builder:builder /opt/arduino /opt/sources /opt/runner /work /in /out
USER builder
WORKDIR /work
ENV WORK=/work

ENTRYPOINT ["/opt/runner/build.sh"]

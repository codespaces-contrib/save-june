FROM debian:bullseye as base
# 👇 Create non-root user called "worker" we will use when running the real app
RUN groupadd --gid 1000 worker && useradd -s /bin/bash --uid 1000 --gid worker -m worker

#  ******* Build image  *******
FROM base as build-base
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates curl netbase wget tzdata gnupg2 procps \
    git openssh-client autoconf automake bzip2 dpkg-dev \
    file g++ gcc git imagemagick libbz2-dev libc6-dev libcurl4-openssl-dev libdb-dev libevent-dev \
    libffi-dev libgdbm-dev libglib2.0-dev libgmp-dev libjpeg-dev libkrb5-dev liblzma-dev \
    libmagickcore-dev libmagickwand-dev libmaxminddb-dev libncurses5-dev libncursesw5-dev libpng-dev \
    libpq-dev libreadline-dev libsqlite3-dev libssl-dev libtool libwebp-dev libxml2-dev libxslt-dev \
    libyaml-dev make patch unzip xz-utils zlib1g-dev jq shc \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*
# 👇 Install Go - Should be verifiying signature since this is not secure, but omitting for simplicity
ENV GOROOT=/usr/local/go
ENV PATH="${PATH}:${GOROOT}/bin"
RUN curl -fsSL -o /tmp/go.tar.gz "https://golang.org/dl/go1.17.7.linux-$(dpkg --print-architecture).tar.gz" \
    && mkdir -p "${GOROOT}" \
    && tar -C "${GOROOT}" -xzf /tmp/go.tar.gz --strip-components=1 \
    && rm -f /tmp/go.tar.gz \
    && mkdir -p /go \
    && chown worker:worker /go

#  ******* Dev container image  *******
FROM build-base as devcontainer
RUN apt-get update \
    # 👇 Adds ~50 common and convienence packages (e.g. htop) and quality of life improvments (e.g. Oh My Zsh!)
    && bash -c "$(curl -fsSL "https://raw.githubusercontent.com/microsoft/vscode-dev-containers/main/script-library/common-debian.sh")" -- true worker 1000 1000 false true true \
    # 👇 Install postgresql client
    && . /etc/os-release \
    && curl -sSLf https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor > /usr/share/keyrings/postgresql.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*
# 👇 Install Go tools required by Go extension into image
ARG GO_TOOLS="\
    golang.org/x/tools/gopls@latest \
    honnef.co/go/tools/cmd/staticcheck@latest \
    golang.org/x/lint/golint@latest \
    github.com/mgechev/revive@latest \
    github.com/uudashr/gopkgs/v2/cmd/gopkgs@latest \
    github.com/ramya-rao-a/go-outline@latest \
    github.com/go-delve/delve/cmd/dlv@latest \
    github.com/golangci/golangci-lint/cmd/golangci-lint@latest"
RUN export PATH=${TARGET_GOROOT}/bin:${PATH} \
    && mkdir -p /tmp/gotools /usr/local/etc/vscode-dev-containers ${TARGET_GOPATH}/bin \
    && cd /tmp/gotools \
    && export GOPATH=/tmp/gotools \
    && export GOCACHE=/tmp/gotools/cache \
    && echo "${GO_TOOLS}" | xargs -n 1 go install -v \
    && mv /tmp/gotools/bin/* /usr/local/bin/ \
    && rm -rf /tmp/gotools

#  ******* Final production image  *******

# 👇 Use a temp image to mount the code during image build (only), build and then put result in /service
FROM build-base as service-build
RUN --mount=source=.,target=/source-code,type=bind,rw bash /source-code/build-worker.sh /service

# 👇 Copy the contents of the /out folder in the temp image into /app in a fresh image from the base
FROM base as production
ENV GIN_MODE=release
COPY --from=service-build /service /service
WORKDIR /service/
USER worker
EXPOSE 8080
CMD ["/service/worker"]


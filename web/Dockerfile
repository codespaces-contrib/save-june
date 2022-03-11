FROM debian:bullseye as base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl netbase wget tzdata gnupg2 procps \
    # 👇 Install node - not the secure way to do it, but omitting for simplicity
    && curl -sSLf https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/* \
    # 👇 Create non-root user called "web" we will use when running the real app
    && groupadd --gid 1000 web && useradd -s /bin/bash --uid 1000 --gid web -m web

#  ******* Build image  *******
FROM base as build-base
RUN apt-get update \
    && apt-get install -y --no-install-recommends git openssh-client autoconf automake bzip2 dpkg-dev \
    file g++ gcc git imagemagick libbz2-dev libc6-dev libcurl4-openssl-dev libdb-dev libevent-dev \
    libffi-dev libgdbm-dev libglib2.0-dev libgmp-dev libjpeg-dev libkrb5-dev liblzma-dev \
    libmagickcore-dev libmagickwand-dev libmaxminddb-dev libncurses5-dev libncursesw5-dev libpng-dev \
    libpq-dev libreadline-dev libsqlite3-dev libssl-dev libtool libwebp-dev libxml2-dev libxslt-dev \
    libyaml-dev make patch unzip xz-utils zlib1g-dev jq python3-minimal \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

#  ******* Dev container image  *******
FROM build-base as devcontainer
RUN apt-get update \
    # 👇 Adds ~50 common and convienence packages (e.g. htop) and quality of life improvments (e.g. Oh My Zsh!)
    && bash -c "$(curl -fsSL "https://raw.githubusercontent.com/microsoft/vscode-dev-containers/main/script-library/common-debian.sh")" -- true web 1000 1000 false true true \
    # 👇 Install postgresql client
    && . /etc/os-release \
    && curl -sSLf https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor > /usr/share/keyrings/postgresql.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

#  ******* Final production image  *******

# 👇 Use a temp image to mount the code during image build (only), build and then put result in /app
FROM build-base as app-build
ENV NODE_ENV=production
RUN --mount=source=.,target=/source-code,type=bind,rw bash /source-code/build-web.sh /app

# 👇 Copy the contents of the /out folder in the temp image into /app in a fresh image from the base
FROM base as production
ENV NODE_ENV=production
COPY --from=app-build /app /app
WORKDIR /app/
USER web
EXPOSE 3000
CMD ["npm", "start"]

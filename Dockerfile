FROM node:10

ENV WATCHMAN_VERSION 4.9.0
ENV ONEDRIVE_REFRESH_TOKEN=""

# System Dependencies.
RUN apt-get update && apt-get install -y \
		python-dev \
	--no-install-recommends && rm -r /var/lib/apt/lists/*

# Increase the number of inotify watchers
RUN echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf

RUN mkdir /watchman \
  && cd /watchman \
  && curl -fSL "https://github.com/facebook/watchman/archive/v${WATCHMAN_VERSION}.tar.gz" -o watchman.tar.gz \
	&& tar -xz --strip-components=1 -f watchman.tar.gz \
	&& rm watchman.tar.gz \
	&& ./autogen.sh \
  && ./configure \
  && make \
  && make install

WORKDIR /app

COPY ./ /app

RUN npm install --production --unsafe-perm

RUN mkdir /data

CMD ["./bin/onedrive", "watch", "/data"]

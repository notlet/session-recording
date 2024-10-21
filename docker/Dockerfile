FROM ghcr.io/linuxserver/baseimage-kasmvnc:ubuntunoble

# set version label
ARG BUILD_DATE
ARG VERSION
ARG FIREFOX_VERSION
LABEL build_version="Linuxserver.io version:- ${VERSION} Build-date:- ${BUILD_DATE}"
LABEL maintainer="thelamer"

# title
ENV TITLE=Recorder

# prevent Ubuntu's firefox stub from being installed
COPY /root/etc/apt/preferences.d/firefox-no-snap /etc/apt/preferences.d/firefox-no-snap

RUN \
  echo "**** add icon ****" && \
  curl -o \
    /kclient/public/icon.png \
    https://raw.githubusercontent.com/linuxserver/docker-templates/master/linuxserver.io/img/firefox-logo.png

RUN \
  echo "**** install packages ****" && \
  apt-key adv \
    --keyserver hkp://keyserver.ubuntu.com:80 \
    --recv-keys 738BEB9321D1AAEC13EA9391AEBDF4819BE21867 && \
  apt-key adv \
    --keyserver hkp://keyserver.ubuntu.com:80 \
    --recv-keys BC7345F522079769F5BBE987EFC71127F425E228 && \
  echo \
    "deb https://ppa.launchpadcontent.net/mozillateam/ppa/ubuntu noble main" > /etc/apt/sources.list.d/firefox.list && \
  echo \
    "deb https://ppa.launchpadcontent.net/obsproject/obs-studio/ubuntu noble main" > /etc/apt/sources.list.d/obsstudio.list && \
  apt-get update && \
  apt-get install -y --no-install-recommends \
    firefox \
    firefox-locale-en \
    firefox-locale-uk \
    ffmpeg \
    obs-studio 

RUN \
  echo "**** cleanup ****" && \
  rm -rf \
    /tmp/*

# configs for firefox
COPY /configs/firefox.js /usr/lib/firefox/browser/defaults/preferences/firefox.js
COPY /configs/policies.json /etc/firefox/policies/policies.json

# configs for obs-studio
COPY --chown=1000:1000 /configs/obs-studio /home/kasm-user/.config/obs-studio

# add local files
COPY /root /

# ports and volumes
EXPOSE 3000

VOLUME /config

#!/bin/bash

##
# Config
##

APP_PORTS=("2000" "2001")
APP_END_POINTS=("$(pwd)/endpoints/rootEndpoint" "$(pwd)/endpoints/adminEndpoint")

##
# Functions
##

function START() {
  clear && echo -e "\033[1;32m[v] Starting StoreTS\033[0m"

  for INDEX in "${!APP_PORTS[@]}"
  do
    APP_PORT="${APP_PORTS[INDEX]}"
    APP_END_POINT="${APP_END_POINTS[INDEX]}"

    (
      npm start --prefix $APP_END_POINT -- --port $APP_PORT 
    ) &
  done
}

CHECK_REPO() {
  if [[ $(git status --porcelain) ]]; then
    echo 1
  else
    echo 0
  fi
}

function KILL() {
  for INDEX in "${!APP_PORTS[@]}"
  do
    APP_PORT="${APP_PORTS[INDEX]}"

    fuser -k $APP_PORT/tcp
  done

  echo -e "\033[1;31m[x] StoreTS killed\033[0m"

  exit
}

function STOP() {
  for INDEX in "${!APP_PORTS[@]}"
  do
    APP_PORT="${APP_PORTS[INDEX]}"

    fuser -k $APP_PORT/tcp
  done

  echo -e "\033[1;31m[x] StoreTS stopped\033[0m"
}

##
# Main
##

START
trap KILL SIGINT

sleep 10

while true
do
  if [ ! $(CHECK_REPO) -eq 0 ]; then
    echo -e "\033[1;31m[x] StoreTS local repository is not up to data\033[0m"
    clear && echo -e "\033[1;32m[v] Starting StoreTS local repository update\033[0m"

    STOP

    git pull

    clear && echo -e "\033[1;32m[v] Starting StoreTS local repository has been successfully updated\033[0m"

    sleep 5

    START
  fi

  sleep 10
done




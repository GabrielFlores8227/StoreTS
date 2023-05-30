#!/bin/bash

clear 
echo -e "\033[1;33m[!] Please refrain from using this script during the development phase\033[0m"
echo -e "\033[1;32m[v] Starting processes\033[0m"

ROUTES=("root" "admin")

for ROUTE in "${ROUTES[@]}"; do
  (
    npm start --prefix "$(pwd)/$ROUTE"
  ) &
done

cleanup() {
  echo -ne "\n\033[1;31m[x] "
  kill -- -$$
  exit
}

trap cleanup SIGINT

wait


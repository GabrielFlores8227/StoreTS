#!/bin/bash

clear 
echo -e "\033[1;33m[!] Please refrain from using this script during the development phase\033[0m"
echo -e "\033[1;32m[v] Starting processes\033[0m"

END_POINTS=$(find . -name "*EndPoint";)

for END_POINT in $END_POINTS; 
do
  (
    npm start --prefix $END_POINT
  ) &
done

cleanup() {
  echo -ne "\n\033[1;31m[x] "
  kill -- -$$
  exit
}

trap cleanup SIGINT

wait


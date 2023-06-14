#!/bin/bash

##
# Start
##

clear 
echo -e "\033[1;32m[v] Starting processes...\033[0m"

END_POINTS=$(find . -name "*EndPoint";)

for END_POINT in $END_POINTS; 
do
  (
    npm start --prefix $END_POINT
  ) &
done

##
# Ctrl + c
##

cleanup() {
  kill -- -$$
  exit
}

trap cleanup SIGINT

wait


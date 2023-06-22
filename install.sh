#!/bin/bash

##
# Main
##

APP_END_POINTS=()

if [[ " $* " == *" --root "* ]]
then
  APP_END_POINTS+=("$(pwd)/endpoints/rootEndpoint")
fi

if [[ " $* " == *" --admin "* ]]
then
  APP_END_POINTS+=("$(pwd)/endpoints/adminEndpoint")
fi

if [ ${#APP_END_POINTS[@]} -lt 1 ]
then
  APP_END_POINTS+=("$(pwd)/endpoints/rootEndpoint" "$(pwd)/endpoints/adminEndpoint")
fi

for INDEX in "${!APP_END_POINTS[@]}"
do
  APP_END_POINT="${APP_END_POINTS[INDEX]}"

  npm install --prefix $APP_END_POINT
done

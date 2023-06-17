APP_END_POINTS=("$(pwd)/endpoints/rootEndpoint" "$(pwd)/endpoints/adminEndpoint")

for INDEX in "${!APP_END_POINTS[@]}"
do
  APP_END_POINT="${APP_END_POINTS[INDEX]}"

  npm update --prefix $APP_END_POINT
done

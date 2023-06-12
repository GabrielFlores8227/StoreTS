##
# OS
##

FROM ubuntu:latest

##
# Packages
##

RUN apt-get update

# Nginx
RUN apt-get install -y nginx

# MySQL
RUN apt install -y mysql-server

# Curl
RUN apt-get install -y curl

# Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

##
# Config
##

# Nginx
COPY ./.config/nginx /etc/nginx

# Port
EXPOSE 80

##
# Working Directory
##

WORKDIR /app

COPY . .

##
# CMD
##

COPY ./start.sh /start.sh
RUN chmod +x /start.sh

CMD service nginx start && service mysql start && /start.sh


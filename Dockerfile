FROM nginx:alpine

COPY assets /usr/share/nginx/html/assets
COPY css /usr/share/nginx/html/css
COPY font /usr/share/nginx/html/font
COPY js /usr/share/nginx/html/js
COPY lib /usr/share/nginx/html/lib
COPY sounds /usr/share/nginx/html/sounds
COPY index.html /usr/share/nginx/html/index.html

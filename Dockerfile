FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copiar archivos estáticos
COPY public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

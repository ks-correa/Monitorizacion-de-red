FROM node:20-alpine AS build

WORKDIR /app

COPY apps/gastosmart/frontend/package*.json ./
RUN npm install

COPY apps/gastosmart/frontend/ ./

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine

ARG NGINX_CONF=apps/gastosmart/frontend/nginx.local.conf

COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=build /dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

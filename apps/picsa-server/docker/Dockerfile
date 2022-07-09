# File uploads can't be bound to named volume as will not have permissions
# unless defined in docker image. Setting at runtime also fails
# https://github.com/docker/compose/issues/3270
# https://github.com/docker-library/postgres/issues/796

# This dockerfile provides a workaround by setting required permissions


FROM parseplatform/parse-server:5.2.3
USER root
RUN /bin/sh -c "mkdir -p /parse-server/files && chown node:node /parse-server/files"
USER node
VOLUME /parse-server/files 

EXPOSE 1337

ENTRYPOINT ["node", "./bin/parse-server"]

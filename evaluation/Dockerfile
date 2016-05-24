FROM elgalu/selenium:2.53.0o

ENV LATENCY ${LATENCY}

#USER root

ONBUILD echo "Limit network latency: '${LATENCY}'" \
ONBUILD sudo tc qdisc add dev eth0 root netem delay ${LATENCY}


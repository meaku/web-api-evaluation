## Start Chrome with Proxy

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --proxy-server=localhost:8080

## Docker 

### Selenium

docker run --rm -ti --name=grid -p 4444:24444 -p 5900:25900 \
        --cap-add=NET_ADMIN \
        -e SSHD=true \
        -e SSH_AUTH_KEYS="$(cat ~/.ssh/id_rsa.pub)" \
        -v /dev/shm:/dev/shm -e VNC_PASSWORD=hola \
        -e MAX_INSTANCES=20 -e MAX_SESSIONS=20 \
        elgalu/selenium:2.53.0o
        
        
### Node.js Server 

- reachable via docker-machine ip:<port> (3002) 


## [Throttle network](http://mark.koli.ch/slowdown-throttle-bandwidth-linux-network-interface)

sudo tc qdisc add dev eth0 root netem delay 500ms
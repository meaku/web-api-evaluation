## Start Chrome with Proxy

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --proxy-server=localhost:8080

## Docker 

### Selenium

docker run --rm -ti --name=grid -p 4444:24444 -p 5900:25900 -p 22222:22222 \
        --cap-add=NET_ADMIN \
        -e SSHD=true \
        -e SSH_AUTH_KEYS="$(cat ~/.ssh/id_rsa.pub)" \
        -v /dev/shm:/dev/shm -e VNC_PASSWORD=hola \
        -e MAX_INSTANCES=20 -e MAX_SESSIONS=20 \
        elgalu/selenium:2.53.0o
        
### Node.js Server 

docker build -t simulation-server .

docker run --rm -ti --name=simulation-server -p 3001:3001 -p 3002:3002 \
        simulation-server 

- reachable via docker-machine ip:<port> (3002) 


## [Throttle network](http://mark.koli.ch/slowdown-throttle-bandwidth-linux-network-interface)

- http://www.cyberciti.biz/faq/linux-traffic-shaping-using-tc-to-control-http-traffic/

sudo tc qdisc add dev eth0 root netem delay 500ms

## [TCP Dump](https://wiki.ubuntuusers.de/tcpdump/)

sudo tcpdump -i eth0 -q '(tcp port 3002)'

Certain period: sudo tcpdump -G 10 -W 1 -w myfile -i eth0 -s 0 -q '(tcp port 3001)'  

Wireshark: sudo tcpdump -i wlan0 -s 0 -w output.dump tcp port 80 
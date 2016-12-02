FROM elgalu/selenium

RUN sudo apt-get update
RUN sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tshark

# allow tshark sniffing for non roots
RUN sudo chgrp application /usr/bin/dumpcap
RUN sudo setcap cap_net_raw,cap_net_admin+eip /usr/bin/dumpcap
RUN sudo setcap 'CAP_NET_RAW+eip CAP_NET_ADMIN+eip' /usr/bin/dumpcap


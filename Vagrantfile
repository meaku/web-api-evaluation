# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT
sudo apt-get update
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
sudo apt-get -y install software-properties-common python-software-properties python g++ make
sudo add-apt-repository -y ppa:git-core/ppa

# Chrome (http://askubuntu.com/questions/510056/how-to-install-google-chrome)
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

# Add node.js sources
curl -sL https://deb.nodesource.com/setup_6.x | bash -

sudo apt-get update

sudo apt-get -y install git
sudo apt-get install -y nodejs
sudo apt-get -y install google-chrome-stable

# Chrome Driver
sudo npm -g install chromedriver
sudo ln -sf /usr/lib/node_modules/chromedriver/lib/chromedriver/chromedriver /usr/bin/chromedriver

SCRIPT

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "ubuntu/trusty64"

  config.vm.network "private_network", ip: "192.168.50.100"

  config.vm.hostname = "vagrant.vm"

  config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'" # avoids 'stdin: is not a tty' error.

  config.vm.provision "shell", inline: $script

  # If true, then any SSH connections made will enable agent forwarding.
  config.ssh.forward_agent = true

  config.vm.provider "virtualbox" do |v|
      v.memory = 2048
      v.cpus = 2
   end
end
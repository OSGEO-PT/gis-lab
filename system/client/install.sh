#!/bin/bash
# Author: Ivan Mincik, ivan.mincik@gmail.com

# LTSP troubleshooting https://help.ubuntu.com/community/UbuntuLTSP/ClientTroubleshooting

set -e


# source configuration files
source /vagrant/config.cfg
if [ -f /vagrant/config-user.cfg ]
then
	source /vagrant/config-user.cfg
fi

source /usr/local/gislab/functions.sh

# require root privileges
gislab_require_root


# usage
function usage() {
	echo "USAGE: $(basename $0) [OPTIONS]"
	echo "Install GIS.lab client image."
	echo -e "\nOPTIONS
	-h  display this help
	"
	exit 0
}


# options
while getopts "h" OPTION
do
        case "$OPTION" in
			h) usage ; exit 0 ;;
			\?) exit 1;;
        esac
done
shift $(($OPTIND - 1))


DATETIME=$(date +"%Y-%m-%d-%T")


# backup existing client image
if [ -f /opt/ltsp/images/i386.img ]
then
	gislab_print_info "Creating backup of existing image and removing expired backups"
	cp /opt/ltsp/images/i386.img /opt/ltsp/images/i386-backup-$DATETIME.img
	find /opt/ltsp/images/ -iname "i386-backup*.img" -mtime 7 | xargs rm -vf
fi


# add some ltsp-build-client plugins which takes care about our image customizations
rm -vf /usr/share/ltsp/plugins/ltsp-build-client/Ubuntu/*gislab*

cp -v /vagrant/config.cfg /usr/share/ltsp/plugins/ltsp-build-client/Ubuntu/000-gislab-config # load config
if [ -f /vagrant/config-user.cfg ] # load user config
then
	cp -v /vagrant/config-user.cfg /usr/share/ltsp/plugins/ltsp-build-client/Ubuntu/001-gislab-config-user
fi

cp -av /vagrant/system/client/ltsp/plugins/ltsp-build-client/* /usr/share/ltsp/plugins/ltsp-build-client/Ubuntu/
cp -av /vagrant/user/plugins/client/* /usr/share/ltsp/plugins/ltsp-build-client/Ubuntu/


# build client options
# default options
GISLAB_BUILD_CLIENT_OPTS="--arch i386 --purge-chroot --copy-sourceslist --accept-unsigned-packages "

# use APT proxy for client image creation if configured or at least keep downloaded packages on server
if [ -n "${GISLAB_APT_HTTP_PROXY}" ]; then
	GISLAB_BUILD_CLIENT_OPTS+="--http-proxy $GISLAB_APT_HTTP_PROXY "
else
	GISLAB_BUILD_CLIENT_OPTS+="--copy-package-cache "
fi

# install and remove packages
GISLAB_BUILD_CLIENT_OPTS+='--late-packages "$GISLAB_CLIENT_INSTALL_PACKAGES" '
GISLAB_BUILD_CLIENT_OPTS+='--remove-packages "$GISLAB_CLIENT_REMOVE_PACKAGES" '

# enable debug if requested
if [ "$GISLAB_DEBUG" == "yes" ]; then
	GISLAB_BUILD_CLIENT_OPTS+="--debug "
fi

ltsp-build-client $GISLAB_BUILD_CLIENT_OPTS

ltsp-update-sshkeys
ltsp-update-kernels


# LTSP configuration
cat << EOF > /var/lib/tftpboot/ltsp/i386/lts.conf
[default]
LDM_SESSION=/usr/bin/startxfce4
CLIENT_ENV="DESKTOP_SESSION=xubuntu"
HOSTNAME_BASE=c
LDM_THEME=gislab
LTSP_FATCLIENT=True
LOCAL_APPS=False
#SCREEN_02=shell                          # get local root prompt when pressing Ctrl+Alt+F2 
SCREEN_07=ldm
NFS_HOME=/home
FSTAB_1="server:/storage/repository /mnt/repository nfs defaults 0 0"
FSTAB_2="server:/storage/share /mnt/share nfs defaults 0 0"
FSTAB_3="server:/storage/barrel /mnt/barrel nfs defaults 0 0"
EOF

if [ -n "${GISLAB_CLIENT_NETWORK_STORAGE}" ]; then # mount additional shared dir if configured
cat << EOF >> /var/lib/tftpboot/ltsp/i386/lts.conf
FSTAB_4="$GISLAB_CLIENT_NETWORK_STORAGE"
EOF
fi

service nbd-server restart


# disable plymouth screen for better client troubleshooting on boot
sed -i "s/quiet splash plymouth:force-splash vt.handoff=7//" /var/lib/tftpboot/ltsp/i386/pxelinux.cfg/default


gislab_print_info "Client installation done"


# vim: set ts=4 sts=4 sw=4 noet:
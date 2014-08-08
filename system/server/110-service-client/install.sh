#
### CLIENT INSTALLATION ###
#
# Install GIS.lab client image and configure LAN boot system.


# perform installation only for chosen GIS.lab suites
if [ "$GISLAB_SUITE" != "lab" ]; then
	return
fi


# packages installation
GISLAB_SERVER_INSTALL_PACKAGES="
  ltsp-server-standalone
  tftpd-hpa
"
apt-get --assume-yes --force-yes --no-install-recommends install $GISLAB_SERVER_INSTALL_PACKAGES

# do not allow overriding of DHCP server configuration by LTSP, keep using configuration located in /etc/dhcp
rm -f /etc/ltsp/dhcpd.conf


# list of XUbuntu required packages
GISLAB_CLIENT_INSTALL_PACKAGES_DEFAULT="
    alsa-base
    alsa-utils
    anacron
    bc
    ca-certificates
    dmz-cursor-theme
    doc-base
    foomatic-db-compressed-ppds
    foomatic-filters
    genisoimage
    ghostscript-x
    gtk2-engines
    gtk2-engines-pixbuf
    inputattach
    libasound2-plugins
    libgd2-xpm
    libnss-ldap
    libpam-ck-connector
    libsasl2-modules
    libxp6
    lightdm
    lightdm-gtk-greeter
    nvidia-common
    openprinting-ppds
    printer-driver-pnm2ppa
    rarian-compat
    rfkill
    thunar
    thunar-volman
    ttf-dejavu-core
    ttf-freefont
    tumbler
    ubuntu-extras-keyring
    unzip
    wireless-tools
    wpasupplicant
    xdg-user-dirs
    xdg-user-dirs-gtk
    xfce4-appfinder
    xfce4-notifyd
    xfce4-panel
    xfce4-session
    xfce4-settings
    xfce4-utils
    xfdesktop4
    xfwm4
    xkb-data
    xorg
    xterm
    xubuntu-artwork
    xubuntu-default-settings
    zenity
    zip
"

# list of XUbuntu recommended packages
GISLAB_CLIENT_INSTALL_PACKAGES_DEFAULT+="
    acpi-support
    alacarte
    apport-gtk
    avahi-autoipd
    avahi-daemon
    catfish
    cups
    cups-bsd
    cups-client
    desktop-file-utils
    espeak
    evince
    file-roller
    firefox
    firefox-gnome-support
    fonts-kacst-one
    fonts-khmeros-core
    fonts-lao
    fonts-liberation
    fonts-nanum
    fonts-opensymbol
    fonts-takao-pgothic
    fonts-thai-tlwg
    gcalctool
    gcc
    gimp
    gmusicbrowser
    gstreamer0.10-plugins-base-apps
    gstreamer0.10-pulseaudio
    gthumb
    gucharmap
    gvfs-backends
    gvfs-fuse
    hplip
    ibus
    ibus-gtk
    ibus-pinyin
    ibus-pinyin-db-android
    ibus-table
    im-switch
    indicator-application-gtk2
    indicator-sound-gtk2
    jockey-gtk
    kerneloops-daemon
    laptop-detect
    leafpad
    libnotify-bin
    libnss-mdns
    libpam-gnome-keyring
    make
    pastebinit
    pavucontrol
    pcmciautils
    pidgin
    pidgin-microblog
    policykit-desktop-privileges
    printer-driver-c2esp
    printer-driver-foo2zjs
    printer-driver-min12xxw
    printer-driver-ptouch
    printer-driver-pxljr
    printer-driver-sag-gdi
    printer-driver-splix
    simple-scan
    speech-dispatcher
    system-config-printer-gnome
    thunar-archive-plugin
    thunar-media-tags-plugin
    ttf-indic-fonts-core
    ttf-punjabi-fonts
    ttf-ubuntu-font-family
    ttf-wqy-microhei
    xcursor-themes
    xdg-utils
    xfburn
    xfce4-cpugraph-plugin
    xfce4-datetime-plugin
    xfce4-dict
    xfce4-indicator-plugin
    xfce4-mailwatch-plugin
    xfce4-netload-plugin
    xfce4-notes-plugin
    xfce4-places-plugin
    xfce4-power-manager
    xfce4-quicklauncher-plugin
    xfce4-screenshooter
    xfce4-systemload-plugin
    xfce4-taskmanager
    xfce4-terminal
    xfce4-verve-plugin
    xfce4-volumed
    xfce4-weather-plugin
    xfce4-xkb-plugin
    xubuntu-docs
    xul-ext-ubufox
"

# list of GIS.lab client extra packages
GISLAB_CLIENT_INSTALL_PACKAGES_DEFAULT+="
    aptitude
    conky-std
    eog
    flashplugin-installer
    freerdp-x11
    gdal-bin
    gimp
    git
    google-earth-stable
    gthumb
    gtk-recordmydesktop
    htop
    inkscape
    ipython
    josm
    keepassx
    libgdal1h
    libreoffice
    libreoffice-calc
    libreoffice-gtk
    libreoffice-writer
    mc
    nfs-common
    openssh-server
    pgadmin3
    postgresql-client
    postgresql-comparator
    python-pysqlite2
    python-gdal
    python-qgis
    qgis
    qgit
    rst2pdf
    spatialite-bin
    spatialite-gui
    sqlite3
    sshfs
    vim-gnome
    vlc
"
export GISLAB_CLIENT_INSTALL_PACKAGES_DEFAULT

# List of packages to remove client images. Do not use <tab> for indentation.
# To find out the reason why package was installed use '$ aptitude why <package>'.
GISLAB_CLIENT_REMOVE_PACKAGES="
    network-manager
    network-manager-gnome
    network-manager-pptp
    network-manager-pptp-gnome
"
export GISLAB_CLIENT_REMOVE_PACKAGES

source $GISLAB_INSTALL_CLIENT_ROOT/install.sh # install client image


# vim: set syntax=sh ts=4 sts=4 sw=4 noet:

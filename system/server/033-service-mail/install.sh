#
### MAIL SERVER - POSTFIX ###
#
# Install and configure email server.

# Logging: 
#   production: /var/log/mail-error.log
#   debug:      /var/log/mail-debug.log

# packages installation
GISLAB_SERVER_INSTALL_PACKAGES="
  bsd-mailx
  mutt
  postfix
  postfix-ldap
  sasl2-bin
"
apt-get --assume-yes --force-yes --no-install-recommends install $GISLAB_SERVER_INSTALL_PACKAGES


# main configuration file
cp $GISLAB_INSTALL_CURRENT_ROOT/conf/postfix/main.cf /etc/postfix/main.cf
gislab_config_header_to_file /etc/postfix/main.cf

# local LDAP aliases search table
cp $GISLAB_INSTALL_CURRENT_ROOT/conf/postfix/ldap-aliases.cf /etc/postfix/ldap-aliases.cf
gislab_config_header_to_file /etc/postfix/ldap-aliases.cf

rm -f /etc/postfix/sasl_passwd /etc/postfix/sasl_passwd.db

if [ -n "$GISLAB_SERVER_EMAIL_RELAY_LOGIN" -a -n "$GISLAB_SERVER_EMAIL_RELAY_PASSWORD" -a -n "$GISLAB_SERVER_EMAIL_RELAY_SERVER" ]; then
	sed -i "s/^relayhost =.*/relayhost = [$GISLAB_SERVER_EMAIL_RELAY_SERVER]:587/" /etc/postfix/main.cf
	echo "smtp_tls_security_level = encrypt" >>  /etc/postfix/main.cf
	echo "smtp_sasl_security_options = noanonymous" >> /etc/postfix/main.cf
	echo "smtp_sasl_auth_enable = yes" >>  /etc/postfix/main.cf
	echo "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd" >> /etc/postfix/main.cf
	echo "[$GISLAB_SERVER_EMAIL_RELAY_SERVER]:587 $GISLAB_SERVER_EMAIL_RELAY_LOGIN:$GISLAB_SERVER_EMAIL_RELAY_PASSWORD" > /etc/postfix/sasl_passwd
	chmod 0600 /etc/postfix/sasl_passwd
	postmap /etc/postfix/sasl_passwd
fi

service postfix restart


### LOGGING ###
if [ "$GISLAB_DEBUG_SERVICES" == "no" ]; then
cat << EOF >> /etc/rsyslog.d/50-default.conf
mail.err /var/log/mail-error.log
EOF
else
cat << EOF >> /etc/rsyslog.d/50-default.conf
mail.* /var/log/mail-debug.log
EOF
fi

# create default log file
touch /var/log/mail-error.log
chmod 0640 /var/log/mail-error.log
chown syslog:adm /var/log/mail-error.log

# remove system default log files
rm -f /var/log/mail.log
rm -f /var/log/mail.err

# check logs with logcheck
echo "/var/log/mail-error.log" >> /etc/logcheck/logcheck.logfiles

service rsyslog restart

### DO NOT CONTINUE ON UPGRADE ###
if [ -f "/var/lib/gislab/$GISLAB_INSTALL_CURRENT_SERVICE.done" ]; then return; fi

# add service user mail alias
echo "postmaster: root" >> /etc/aliases
newaliases

# vim: set syntax=sh ts=4 sts=4 sw=4 noet:

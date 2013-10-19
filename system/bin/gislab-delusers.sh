#!/bin/bash
# Author Ivan Mincik, GISTA s.r.o., ivan.mincik@gmail.com

set -e

source /vagrant/config.cfg
if [ -f /vagrant/config-user.cfg ]
then
	source /vagrant/config-user.cfg
fi

echo -e "\n[GISLAB]: Removing GIS LAB users accounts ...\n"

# remove lab users accounts
for account in "${GISLAB_USER_ACCOUNTS_AUTO[@]}"
do
	# Linux account
	deluser --remove-home $account

	# PostgreSQL account
	sudo su - postgres -c "psql -d gislab -c \"DROP SCHEMA $account CASCADE\""
	sudo su - postgres -c "psql -d gislab -c \"DROP OWNED BY $account CASCADE\""
	sudo su - postgres -c "dropuser $account"

	# NFS directory
	rm -rf /storage/share/$account
done

echo -e "\n[GISLAB]: Done."


# vim: set ts=4 sts=4 sw=4 noet:
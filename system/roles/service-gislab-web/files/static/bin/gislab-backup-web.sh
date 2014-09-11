#!/bin/bash
# Backup GIS.lab Web data.

set -e

source $GISLAB_ROOT/functions.sh

# require root privileges
gislab_require_root

# get current date
DATE=$(date '+%Y-%m-%d:%H-%M-%S')

# backup
mkdir -p /storage/backup
BACKUP_FILE=/storage/backup/gislab-web-storage-backup-$DATE.json

source /usr/local/python-virtualenvs/gislab-web/bin/activate
/var/www/gislab-web/manage.py dumpdata storage > $BACKUP_FILE
gzip $BACKUP_FILE
chmod 400 $BACKUP_FILE.gz


# vim: set ts=4 sts=4 sw=4 noet:
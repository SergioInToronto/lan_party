#! /bin/bash

exec python3 server/init_db.py add $@ | tee -a ./codes.txt

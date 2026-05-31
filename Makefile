APP_NAME=ura-bot-server
APP_DIR=/${APP_NAME}/src

YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

welcome:
	@clear
	@echo "${BOLD_YELLOW}"
	@echo " ____ ___                   __________             __   " && sleep .02
	@echo "|    |   \ _______  _____   \______   \   ____   _/  |_ " && sleep .02
	@echo "|    |   / \_  __ \ \__  \   |    |  _/  /  _ \  \   __\ " && sleep .02
	@echo "|    |  /   |  | \/  / __ \_ |    |   \ (  <_> )  |  |  " && sleep .02
	@echo "|______/    |__|    (____  / |______  /  \____/   |__|  " && sleep .02
	@echo "                        \/         \/                  " && sleep .02
	@echo "${NOCOLOR}"
	@# http://patorjk.com/software/taag font Graffiti full

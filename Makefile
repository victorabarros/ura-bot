check:
	@echo "\e[1m\033[33mCheck CI\e[0m"
	@cd server/ && make tests-unit

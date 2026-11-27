# Static landing page. Override with `make site SITE_PORT=9090`.
SITE_PORT?=8080
NGINX_IMAGE:=nginx:1.27.5-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10

.PHONY: site

# Serves web/ through nginx in Docker. Nothing to install on the host.
# http://localhost:$(SITE_PORT) — default 8080. Stop with Ctrl-C.
site:
	@docker run --rm \
		--name $(APP_NAME)-site \
		-p $(SITE_PORT):80 \
		-v $(CURDIR)/web:/usr/share/nginx/html:ro \
		$(NGINX_IMAGE)

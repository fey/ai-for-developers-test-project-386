APP_IMAGE ?= feycot/calendar-slot-code:latest
APP_CONTAINER ?= calendar-slot-code

setup:
	npm install

build:
	npm run build

dev:
	npm run dev

start:
	npm run start

test:
	npm run test

test-e2e:
	npm run test:e2e

test-e2e-headed:
	npm run test:e2e:headed

lint:
	npm run lint

tsp-compile:
	npm run tsp:compile

tsp-watch:
	npm run tsp:watch

tsp-clean:
	rm -rf tsp-output

tsp-rebuild: tsp-clean tsp-compile

tsp-openapi: tsp-compile

demo-screenshots:
	npm run demo:screenshots

demo-video:
	npm run demo:video

demo:
	npm run demo

docker-build:
	docker build -t $(APP_IMAGE) -f Dockerfile .

docker-start:
	-docker rm -f $(APP_CONTAINER) >/dev/null 2>&1 || true
	docker run --rm --name $(APP_CONTAINER) -p 8080:8080 -e PORT=8080 $(APP_IMAGE)

docker-push: docker-build
	docker push $(APP_IMAGE)

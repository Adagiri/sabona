.PHONY: create-volumes

create-volumes:
	docker volume create sabonah_postgres_data
	docker volume create sabonah_redis_data

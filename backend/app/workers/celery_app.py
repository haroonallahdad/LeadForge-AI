"""
LeadForge AI — Celery Application
Configures Celery with Redis as broker and result backend.
"""
try:
    from celery import Celery
    celery_app = Celery(
        "leadforge",
        broker=settings.celery_broker_url,
        backend=settings.celery_result_backend,
        include=[
            "app.workers.tasks.search_tasks",
        ],
    )
except ImportError:
    # Dummy object for local dev without celery installed
    class DummyCelery:
        def task(self, *args, **kwargs):
            def decorator(func):
                func.delay = lambda *a, **kw: None
                return func
            return decorator
        
        class Conf:
            def update(self, *args, **kwargs):
                pass
        conf = Conf()
    
    celery_app = DummyCelery()

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.tasks.search_tasks.*": {"queue": "search"},
    },
    task_soft_time_limit=3600,   # 1 hour soft limit
    task_time_limit=7200,        # 2 hour hard limit
    result_expires=86400,        # Results kept for 24 hours
)

from django.conf import settings
from django.db import connection
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page

from mystops.mvt import make_mvt_view

from .models import Stop


CACHE_TIME = 30 if settings.DEBUG else (6 * 60 * 60)


@cache_page(CACHE_TIME)
def index(request):
    """Return all stops as JSON."""
    stops = Stop.objects.all()
    stops = tuple(
        {
            "id": stop.stop_id,
            "name": stop.name,
            "direction": stop.direction,
            "location": (stop.location.x, stop.location.y),
            "created_at": stop.created_at,
            "updated_at": stop.updated_at,
        }
        for stop in stops
    )
    return JsonResponse(
        {
            "stops": stops,
            "count": len(stops),
        }
    )


@cache_page(CACHE_TIME)
def stop(request, stop_id):
    stop = get_object_or_404(Stop, stop_id=stop_id)
    return JsonResponse(
        {
            "stop": {
                "id": stop.stop_id,
                "name": stop.name,
                "direction": stop.direction,
                "location": (stop.location.x, stop.location.y),
            }
        }
    )


mvt = cache_page(CACHE_TIME)(
    make_mvt_view("stop", "location", {"stop_id": "id", "name": None})
)

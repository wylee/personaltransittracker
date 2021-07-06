from django.conf import settings
from django.db import connection
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page

import mercantile

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


MVT_STATEMENT = """\
SELECT
  ST_AsMVT(q, 'stops')
FROM (
  SELECT
    stop.stop_id AS id,
    stop.name,
    stop.direction,
    string_agg(route.short_name, ', ') as routes,
    ST_AsMVTGeom(
      stop.location,
      ST_MakeBox2D(ST_Point(%s, %s), ST_Point(%s, %s))
    ) AS geom
  FROM
    stop
  JOIN
    stop_route
    ON stop_route.stop_id = stop.id
  JOIN
    route
    ON stop_route.route_id = route.id
  WHERE
    ST_Intersects(
      stop.location,
      ST_MakeEnvelope(%s, %s, %s, %s, 4326)
    )
  GROUP BY
    stop.id
) AS q;\
"""


@cache_page(CACHE_TIME)
def mvt(request, z, x, y, *, statement=MVT_STATEMENT, bounds=mercantile.bounds):
    minx, miny, maxx, maxy = bounds(x, y, z)
    bind_params = (minx, miny, maxx, maxy, minx, miny, maxx, maxy)
    with connection.cursor() as cursor:
        cursor.execute(statement, bind_params)
        row = cursor.fetchone()
        content = row[0]
    return HttpResponse(
        content=content, charset=None, content_type="application/x-protobuf"
    )

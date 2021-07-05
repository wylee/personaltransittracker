from textwrap import dedent

from django.db import connection
from django.http import HttpResponse

import mercantile


MVT_STATEMENT = """\
WITH mvt_geom AS (
  SELECT
    {properties},
    ST_AsMVTGeom(
      {geom_column},
      ST_MakeBox2D(ST_Point(%s, %s), ST_Point(%s, %s))
    ) AS geom
  FROM
    {table}
  WHERE
    ST_Intersects(
      {geom_column},
      ST_MakeEnvelope(%s, %s, %s, %s, 4326)
    )
)
SELECT
  ST_AsMVT(mvt_geom.*)
FROM
  mvt_geom;\
"""


def make_mvt_view(table, geom_column, properties):
    statement = MVT_STATEMENT.format(
        table=table,
        geom_column=geom_column,
        properties=",\n    ".join(
            f"{name} as {alias}" if alias else name
            for name, alias in properties.items()
        ),
    )

    def view(request, z, x, y, *, statement=statement, bounds=mercantile.bounds):
        minx, miny, maxx, maxy = bounds(x, y, z)
        bind_params = (minx, miny, maxx, maxy, minx, miny, maxx, maxy)
        with connection.cursor() as cursor:
            cursor.execute(statement, bind_params)
            row = cursor.fetchone()
            content = row[0]
        return HttpResponse(
            content=content, charset=None, content_type="application/x-protobuf"
        )

    return view

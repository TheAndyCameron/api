SELECT
    things.id
FROM
    things
WHERE
    things.type = $(thingtype)
ORDER BY
    things.id
;

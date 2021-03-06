SELECT title, thingid
FROM localized_texts, things
WHERE language = ${language} AND
      things.id = localized_texts.thingid AND
      things.hidden = false AND
      type = ${type}
ORDER BY thingid ASC
LIMIT ${limit}
OFFSET ${offset}
;

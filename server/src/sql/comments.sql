SELECT c.id,
    c.comment,
    c."createdAt",
    c."userId",
    CASE
        WHEN COUNT(r.id) > 0 THEN(
            json_agg(
                json_build_object(
                    'id',
                    r.id,
                    'comment',
                    r.comment,
                    'createdAt',
                    r."createdAt",
                    'userId',
                    r."userId"
                )
            )
        )
        ELSE NULL
    END AS "childComments"
FROM "comment" AS c
    LEFT JOIN comment AS r ON r."parentCommentId" = c.id
WHERE c."postId" = 226
    AND c."parentCommentId" IS NULL
GROUP BY c.id,
    c.comment,
    c."createdAt",
    c."userId"
ORDER BY c."createdAt" DESC
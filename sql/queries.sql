--
-- vw_post - gets a post and the image data for it
--
SELECT p.*
	, bi.filename AS bi_filename
	, bi.md5 AS bi_md5
	, bi.sha1 AS bi_sha1
	, bi.width AS bi_width
	, bi.height AS bi_height
	, bi.size AS bi_size
	, si.filename AS si_filename
	, si.md5 AS si_md5
	, si.sha1 AS si_sha1
	, si.width AS si_width
	, si.height AS si_height
	, si.size AS si_size
	, ti.filename AS ti_filename
	, ti.md5 AS ti_md5
	, ti.sha1 AS ti_sha1
	, ti.width AS ti_width
	, ti.height AS ti_height
	, ti.size AS ti_size
	, u.type AS submitter_type
	, u.username AS submitter_name
FROM post p
LEFT JOIN image bi
	ON bi.type = 1
		AND p.id = bi.post_id
LEFT JOIN image si
	ON si.type = 1
		AND p.id = si.post_id
LEFT JOIN image ti
	ON ti.type = 1
		AND p.id = ti.post_id
LEFT JOIN user u
	ON u.id = p.submitter
-- WHERE p.status = 5
ORDER BY p.id DESC
-- LIMIT 5
-- OFFSET 0
;

--
-- vw_post_tags - gets all the tags for a post
--
SELECT
	pt.post_id
	, t.*
FROM tag t
LEFT JOIN post_tag pt
	ON t.id = pt.tag_id
-- WHERE pt.post_id in(%s)
GROUP BY pt.post_id, pt.tag_id
ORDER BY t.title ASC, pt.post_id ASC
;

--
-- vw_aliased_tags - resolves aliased tags to their hosts
--
SELECT
	t.*
	, a.title AS old_tag
FROM tag t
LEFT JOIN tag_alias a
	ON t.id = a.tag_id
-- WHERE a.title in(%s)
;

--
-- getting tag_ids by tag titles, and resolving tag aliases simultaneously
--  the output of this query is then fed into the two combined queries.
--
-- note: can't subquery tags themselves in the combined queries because of tag-resolution problems;
--  if an aliased tag resolves to an already-specified tag, the HAVING COUNT will fail
--
(
	SELECT t.id as tag_id
	FROM tag t
	WHERE
		t.title IN('aeronaut_sucks', 'aliased_tag', 'more_tags')
		AND t.type <> 6 -- type 6 = aliased tag (should be destroyed on creation of the alias theoretically)
)
UNION DISTINCT
(
	SELECT t.id as tag_id
	FROM tag t
	JOIN tag_alias a
		ON t.id = a.tag_id
	WHERE
		a.title IN('aeronaut_sucks', 'aliased_tag', 'more_tags')
)
;

--
-- Combined query, tag search + post query
--  HERE BE DRAGONS.
--
SELECT p.*
FROM vw_post p
JOIN post_tag pt
	ON pt.post_id = p.id
JOIN tag t
	ON pt.tag_id = t.id
WHERE t.id IN(%s)
GROUP BY p.id
	HAVING COUNT(t.id) = %d
;
-- replace COUNT(t.id) comparison subject with count of tags to search


--
-- SUPER ULTRA COMBINED QUERY. FUCK MY LIFE.
--  HERE BE CTHULHU
--
SELECT p.*
FROM vw_post p
LEFT OUTER JOIN (
	SELECT pt.post_id
	FROM post_tag pt
	JOIN tag t
		ON pt.tag_id = t.id
	WHERE t.id IN (%s)
) notag
	ON p.id = notag.post_id
INNER JOIN (
	SELECT pt.post_id
	FROM post_tag pt
	JOIN tag t
		ON pt.tag_id = t.id
	WHERE t.id IN (%s)
	GROUP BY pt.post_id
		HAVING COUNT(t.id) = %d
) yestag
	ON p.id = yestag.post_id
WHERE notag.post_id IS NULL
;

--
-- Rewrite of the select query, courtesy of Meg. :D
--
SELECT p.*
FROM vw_post p
WHERE p.id IN(
	SELECT DISTINCT pt.post_id
	FROM post_tag pt
	INNER JOIN tag t
		ON t.id = pt.tag_id
	WHERE t.id IN(1) -- %s
	GROUP BY pt.post_id
	HAVING COUNT(t.id) = 1 -- %d
)
AND p.id NOT IN(
	SELECT pt.post_id
	FROM post_tag pt
	WHERE tag_id IN(2) -- %s
)
;

--
-- Resync tag counts
--
UPDATE tag
SET count = (
	SELECT COUNT(id)
	FROM post_tag
	WHERE tag_id = tag.id
)
;
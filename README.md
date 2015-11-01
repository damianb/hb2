# hb2

hb2 (previously homebooru v2) local image gallery built on nodejs (koa). tag searching, meta-tags, remote booru importing/tag importing, etc.

## requirements

* node >= 4.x (?) - possibly only node >= 5
* mariadb
* libvips? (for sharp - image processing/thumbnailing)
* npm packages gulp, bower, globally installed


hb2 is also safe to use with a reverse proxy (such as nginx).

Notes:

sha256 will be used for hashes in privacy mode, coupled with an application-specific seed.

need a worker for resizing, might need another table just for resize queue ops

sharp - image processing, resizing.  only capable of images up to.... 16k wide x 16k high
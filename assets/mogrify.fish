mogrify -resize 128x128 -quality 100 -path new-thumbnails/ mark-256.png
mv new-thumbnails/mark-256.png new-thumbnails/mark-128.png
mogrify -resize 64x64 -quality 100 -path new-thumbnails/ mark-256.png
mv new-thumbnails/mark-256.png new-thumbnails/mark-64.png
mogrify -resize 48x48 -quality 100 -path new-thumbnails/ mark-256.png
mv new-thumbnails/mark-256.png new-thumbnails/mark48.png
mogrify -resize 32x32 -quality 100 -path new-thumbnails/ mark-256.png
mv new-thumbnails/mark-256.png new-thumbnails/mark-32.png
mogrify -resize 16x16 -quality 100 -path new-thumbnails/ mark-256.png
mv new-thumbnails/mark-256.png new-thumbnails/mark-16.png

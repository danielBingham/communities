# Test Media

The images and video the tests attach to posts. `../media.js` names them
for the tests (`getMedia('image-1')`) and makes corrupted copies of them in
memory.

| File | |
| ---- | - |
| `image-asset-1.jpg`, `image-asset-2.jpg`, `image-asset-3.jpg` | Photos. |
| `video-asset.mp4` | A 31 second video, 2160 by 3840. |
| `image-asset.png` | `image-asset-3.jpg`, scaled down, as a PNG. |
| `video-asset.mov` | The first 4 seconds of `video-asset.mp4`, scaled down, as a QuickTime movie. |

The `.png` and `.mov` are there to test that each supported format posts, so
they're small, to keep those tests quick. They were made with
[ffmpeg](https://ffmpeg.org/):

```
ffmpeg -i image-asset-3.jpg -vf scale=960:-1 -pix_fmt rgb24 image-asset.png
ffmpeg -i video-asset.mp4 -t 4 -vf scale=360:-2 -c:v libx264 -preset medium -crf 28 \
  -c:a aac -b:a 96k -movflags +faststart -f mov video-asset.mov
```

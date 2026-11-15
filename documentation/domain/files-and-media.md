# Files and Media

Uploading images and videos, processing them into the sizes the client
shows, storing them, and who can see them.

## A File

`files` holds one row per uploaded file:

| Column | Holds |
| ------ | ----- |
| `user_id` | Who uploaded it. |
| `kind` | `image` or `video`. |
| `type`, `mimetype` | What it was uploaded as. |
| `state` | `pending` → `processing` → `ready`, or `error`. |
| `job_id` | The Bull job processing it, so the client can follow its progress. |
| `variants` | The processed sizes available in storage. |
| `thumb_id` | For a video, its poster image (another File). |
| `location`, `filepath` | Where it is in storage. |

Files are used by posts (`post_files`, in order), as profile and group
pictures (`users.file_id`, `groups.file_id`), and by older link previews.

## Uploading

1. **Create the record:** `POST /files` with what's about to be uploaded,
   which creates a `pending` File. The client shows it in the form.
2. **Upload:** `POST /upload/:id/image` or `POST /upload/:id/video`, a
   multipart form with `file`. The upload middleware writes it to the app's
   `tmp/` folder, refusing unsupported types and sizes over the limit.
3. **Store and queue:** the controller uploads the original to storage,
   marks the File `processing`, adds a `resize-image` or `process-video` job,
   and saves its `job_id`.
4. **Process:** the worker makes the variants and marks the File `ready`
   (or `error`). See [Jobs](../worker/jobs.md).
5. **Follow along:** the client subscribes to the job's events and shows
   its progress until it's done. See [Real-Time](../client/real-time.md).

| Kind | Accepted | Size limit | Processed into |
| ---- | -------- | ---------- | -------------- |
| Image | `.jpg`, `.jpeg`, `.png` | 30 MB | Widths 30, 200, 325, 450 and 650 pixels. |
| Video | `.mp4`, `.mov` | 700 MB | A transcoded video, and a poster image (resized like any image). |

Video uploads are behind the `video-uploads` flag.

## Cropping

Profile and group pictures are cropped after upload: `PATCH /file/:id`
with `crop` (`x`, `y`, `width`, `height`), which `ImageService.crop()`
applies.

## Serving

Files are never public. `GET /file/:id/source?variant=650` checks the user
can see the file and answers with a signed link for that variant, which
the client loads:

- **S3:** a presigned URL to the bucket, valid for a week.
- **Filesystem (development):** a signed link to the web application's
  `/api/0.0.0/storage/` route.

In storage, a file's variants are named `<id>.<variant>.<extension>`, and
the original `<id>.<extension>`.

## Who Can See a File

`FilePermissions.canViewFile()` works out how the file is used:

| Used as | Visible to |
| ------- | ---------- |
| Anything | Its uploader, and site moderators. |
| A link preview's image | Everyone. |
| On a post | Whoever can see the post. |
| A group's picture | Whoever can see the group. |
| A profile picture | Whoever can see the user. |
| A video's poster | Whoever can see the video. |

Only the uploader can update (crop) a file. The uploader, site moderators,
and the admins of a group whose picture it is can delete it. Deleting
removes it and its variants from storage; anything that used it (a profile
picture) is set back to none by the database.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controller | `web-application/server/controllers/FileController.js`, `web-application/server/controllers/JobController.js` |
| Upload middleware | `web-application/server/middleware/upload.js` |
| Services | `packages/backend/services/FileService.js`, `packages/backend/services/files/` |
| Storage | `packages/backend/services/storage/`. See [Drivers](../backend/drivers.md). |
| Data | `packages/backend/daos/FileDAO.js`, the `files` and `post_files` tables |
| Validation and permissions | `packages/shared/schema/File.js`, `packages/backend/services/validation/FileValidation.js`, `packages/backend/services/permission/FilePermissions.js` |
| Worker | `worker/jobs/resizeImage.js`, `worker/jobs/processVideo.js` |
| Client | `web-application/client/state/File/`, `state/jobs.js`, `components/files/`, `components/ui/Image/`, `components/ui/Video/` |
| Tests | `web-application/test/e2e/suites/Post/create.spec.js` (images and videos on posts) |
| Manual cases | `documentation/testing/test-cases/File/` |

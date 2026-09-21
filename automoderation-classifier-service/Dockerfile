FROM python:3.12-slim

WORKDIR /src

# Keep Python from writing .pyc files into the bind-mounted source tree in
# development, and keep stdout unbuffered so logs reach `docker compose logs`
# as they happen rather than when the buffer fills.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Where Python looks for the service's top-level packages (api, classifiers,
# config, services).  Set explicitly so the app imports the same way whether
# it is started by uvicorn, by pytest, or by `python main.py`.
ENV PYTHONPATH=/src

# Dependencies first, in their own layer, so that a source change doesn't
# invalidate the pip install.  Same reasoning as the COPY ordering in
# worker/Dockerfile.
#
# Unlike the Node services, there is no CodeArtifact secret to mount: this
# service depends only on public PyPI packages and no @communities/* packages.
# That is a consequence of keeping it decoupled, and it makes this image
# considerably cheaper to build.
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy source one directory per command, least likely to change to most
# likely, to maximize layer caching across rebuilds.  Tests are deliberately
# left out of the image.
COPY config config
COPY classifiers classifiers
COPY services services
COPY api api
COPY main.py main.py

# Run as a non-root user.  The service takes untrusted user content as input,
# which is exactly the kind of process that should not be root.
RUN useradd --create-home --shell /usr/sbin/nologin classifier \
    && chown -R classifier:classifier /src
USER classifier

EXPOSE 8081

# Host and port come from config/classifiers.yaml and can be overridden with
# the HOST and PORT environment variables.
ENTRYPOINT [ "python", "main.py" ]

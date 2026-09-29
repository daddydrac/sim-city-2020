FROM python:3.12-alpine
WORKDIR /app
RUN addgroup -g 10001 city && adduser -D -u 10001 -G city city && mkdir /data && chown city:city /data
COPY dist/ /app/dist/
COPY server/ /app/server/
ENV CITY_HOST=0.0.0.0 CITY_DATA=/data PYTHONDONTWRITEBYTECODE=1
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/api/games',timeout=2)" || exit 1
CMD ["python", "server/server.py"]
